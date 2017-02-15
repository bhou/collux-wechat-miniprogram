class Addon {
  constructor(options) {
    this.options = options;
  
    this._observers = {};
  }

  addObserver(name, observer) {
    this._observers[name] = observer;
    return this;
  }

  addObservers(obs) {
    for (let k in obs) {
      if (obs.hasOwnProperty(k)) {
        this.addObserver(k, obs[k]);
      }
    }
  }

  observers() {
    return this._observers;
  }

  run() {
  }
}

module.exports = Addon;
