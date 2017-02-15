const Constants = {
  CLIENT_ID: 'id',
  MSG_TYPE: 'type',
  DATA: 'data',
};

class Socket {
  constructor(clientId, conn, ns) {
    this.clientId = clientId;
    this.clientInfo = null;
    this.conn = conn;
    this.ns = ns;

    this.listeners = new Map();

    this.conn.onSocketMessage((message) => {
      this.handle(message.data);
    });
  }

  setClientId(id) {
    this.clientId = id;
  }

  setClientInfo(info) {
    this.clientInfo = info;
  }

  on(msg, listener) {
    if (!this.listeners.has(msg)) {
      this.listeners.set(msg, []);
    }
    this.listeners.get(msg).push(listener);
  }

  handle(message) {
    try {
      let payload = JSON.parse(message);
      let type = payload[Constants.MSG_TYPE];
      let data = payload[Constants.DATA];
      let ls = this.listeners.get(type);
      if (!ls) return;
      ls.forEach(l => {
        l(data);
      });
    } catch (err) {
      console.error(err);
      return;
    }
  }

  emit(msg, data = {}) {
    let payload = {};
    payload[Constants.MSG_TYPE] = msg;
    payload[Constants.CLIENT_ID] = this.clientId;
    payload[Constants.DATA] = data;
    this.conn.sendSocketMessage({
      data: JSON.stringify(payload),
      // success: () => {console.log('socket send ok')},
      // fail: () => {console.error('socket fail')}
    });
  }

  close() {
    this.conn.closeSocket();
  }
}

module.exports = Socket;

