const Socket = require('./Socket');

class Client {
  constructor(url, clientId, clientSecret, retryTimeout, maxRetry) {
    if (typeof url === 'string') {
      this.url = url;
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.retryTimeout = retryTimeout || 5000;
      this.maxRetry = maxRetry || Infinity;
    } else if (typeof url === 'object') {
      let opt = url;
      this.url = opt.url;
      this.clientId = opt.clientId;
      this.clientSecret = opt.clientSecret;
      this.retryTimeout = opt.retryTimeout || 5000;
      this.maxRetry = opt.maxRetry || Infinity;
    }

    this.retry = 0;
    this.enableRetry = true;

    this.listeners = new Map();
    this.socket = null;
    this.authCb = null;
    this.unauthCb = null;
    this.retryCb = null;
  }

  connect() {
    wx.connectSocket({
      url: this.url,
    });

    wx.onSocketError((res) => {
      console.log('WebSocket连接打开失败，请检查！');
      this.connected = false;
      if (!this.enableRetry || this.retry >= this.maxRetry) {
        return;
      }

      if (this.retryCb) this.retryCb();
      setTimeout(() => {
        this.retry++;
        this.doConnect();
      }, this.retryTimeout);
    });

    wx.onSocketOpen((res) => {
      this.connected = true;

      if (!this.socket) {
        this.socket = new Socket(this.clientId, wx);
      } else {
        this.socket.reset(this.clientId, wx);
      }

      this.socket.on('authorized', () => {
        this.retry = 0;
        if (this.authCb) this.authCb(this.socket);
      });

      this.socket.on('unauthorized', () => {
        this.connected = false;
        if (this.unauthCb) this.unauthCb();
      });

      this.socket.on('close', () => {
        this.connected = false;
        if (!this.enableRetry || this.retry >= this.maxRetry) {
          return;
        }

        if (this.retryCb) this.retryCb();
        setTimeout(() => {
          this.retry++;
          this.doConnect();
        }, this.retryTimeout);
      });

      this.emit('authentication', {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
    });
  }

  doConnect() {
    if (this.connected) {
      return;
    }
    this.connect();
  }

  on(msg, listener) {
    if (msg === 'authorized') this.authCb = listener;
    if (msg === 'unauthorized') this.unauthCb = listener;
    if (msg === 'retry') this.retryCb = listener;
  }

  emit(msg, data = {}) {
    this.socket.emit(msg, data);
  }
}

module.exports = Client;

