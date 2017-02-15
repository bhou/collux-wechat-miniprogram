require('./cycle')();
const Addon = require('./Addon');
const uuid = require('./uuid');
const Client = require('./Client');

var elements = [];
var signals = [];

var nodes = {};

var topStackBlackList = [
  "invokeObservers",
  "observers.js",
  "node_modules",
  "collar.js",
  "collar.min",
  "collar-dev-client.min"
];

var bottomStackBlackList = [
  "Module._compile",
  "Object.Module._extensions",
  "Module.load",
  "tryModuleLoad",
  "Function.Module._load",
  "Module.runMain",
  "run (node.js",
  "startup (node.js",
  "node.js:"
]

function handleNode(node, options = {}) {
  let style = options.style || {shape : 'circle'};
  let classes = options.classes || [];
  let label = options.label || node._comment || node.type || node.constructor.name;
  let data = options.data || {};

  if (node.hasFeature("todo")) {
    classes.push('todo');
  } else {
    classes.push('impl');
  }

  let stack = new Error().stack.split("\n");
  stack.shift();
  let shifted = true;
  while (shifted && stack.length > 0) {
    shifted = false;
    for (let i = 0; i < topStackBlackList.length; i++) {
      if (stack[0].indexOf(topStackBlackList[i]) >= 0) {
        stack.shift();
        shifted = true;
        break;
      }
    }
  }

  let popped = true;
  while (popped && stack.length > 0) {
    popped = false;
    for (let i = 0; i < bottomStackBlackList.length; i++) {
      if (stack[stack.length-1].indexOf(bottomStackBlackList[i]) >= 0) {
        stack.pop();
        popped = true;
        break;
      }
    }
  }

  for (var i = 0; i < stack.length; i++) {
    stack[i] = stack[i].replace(" at ", " ");
    if (stack[i].length > 60) {
      stack[i] = "... " + stack[i].slice(-57);
    }
  }

  var ret = {
    group : "nodes",
    data : {
      id : node.id,
      model : node.type || node.constructor.name,
      fullName: node.fullName,
      label : label,
      inputs : node.inputs,
      outputs : node.outputs,
      stack : stack,
      meta : node.meta,
      tags : node.tags
    },
    style : style,
    classes : classes.join(' ')
  }

  for (let k in data) {
    ret.data[k] = data[k];
  }

  // handle transport
  if (node._type
    && node._type.indexOf('transport') === 0
    && typeof node.getTransportId === 'function') {
    let transportId = node.getTransportId();
    if (!transportId) {
      return ret;
    }

    ret.data.transport = transportId
  }

  return ret;
}

function handleVariable(node) {
  return handleNode(node, {
    style : {
      shape : 'vee'
    }
  });
}

function handleFilter(node) {
  return handleNode(node, {
    style : {
      'shape' : 'polygon',
      'shape-polygon-points' : "-0.7 -1 0.7 -1 0.1 0 0.1 1 -0.1 1 -0.1 0"
    }
  });
}

function handleProcessor(node) {
  return handleNode(node, {
    style : {
      'shape' : 'rectangle'
    }
  });
}

function handleActuator(node) {
  return handleNode(node, {
    style : {
      'shape' : 'triangle'
    }
  });
}

function prepareNode(node, json) {
  json.push(handleNode(node));
}

function staticToplogyObserver(node, when, downstream) {
  if (when !== "to") return;

  prepareNode(node, elements);
  prepareNode(downstream, elements);

  if (!nodes.hasOwnProperty(node.id)) nodes[node.id] = node;
  if (!nodes.hasOwnProperty(downstream.id)) nodes[downstream.id] = downstream;

  elements.push({
    group: "edges",
    data : {
      id: uuid.v1(),
      source : node.id,
      target: downstream.id,
    }
  });

  // handle delegator
  if (node._type === 'delegator') {
    let inputDelegation = node._inputDelegation;
    let outputDelegation = node._outputDelegation;

    if (!nodes.hasOwnProperty(inputDelegation.id)) {
      nodes[inputDelegation.id] = inputDelegation;
      prepareNode(inputDelegation, elements);
    }
    if (!nodes.hasOwnProperty(outputDelegation.id)) {
      nodes[outputDelegation.id] = outputDelegation;
      prepareNode(outputDelegation, elements);
    }

    elements.push({
      group: "edges",
      data : {
        id: uuid.v1(),
        source : node.id,
        target: inputDelegation.id,
        type: 'delegation',
        direction: 'request'
      }
    });

    elements.push({
      group: "edges",
      data : {
        id: uuid.v1(),
        source : outputDelegation.id,
        target: node.id,
        type: 'delegation',
        direction: 'response'
      }
    });
  }
}

function signalFlowObserver(node, when, signal) {
  if (!JSON.decycle) {
    require('./cycle')();
  }
  if (when !== "onReceive" && when !== "send") return;

  let errorJSON = null;
  if (signal.error) {
    errorJSON = {};
    for (let k in signal.error) {
      if (signal.error.hasOwnProperty(k)) {
        errorJSON[k] = signal.error[k];
      }
    }
    errorJSON.name = signal.error.name;
    errorJSON.message = signal.error.message;
    errorJSON.stack = signal.error.stack.split('\n');
  }

  let t = new Date().getTime();
  signals.push({
    when : when,
    time : t,
    nodeId : node.id,
    seq : signal.seq,
    payload : JSON.decycle(signal.payload, true),
    error : errorJSON,
    end : signal.end
  });

  if (when == "onReceive" && node._type === 'delegator') {
    let t = new Date().getTime();
    signals.push({
      when : "send",
      time : t,
      nodeId : node.id,
      seq : signal.seq,
      payload : JSON.decycle(signal.payload, true),
      error : errorJSON,
      end : signal.end
    });
  }
}

class DevToolAddon extends Addon {
  constructor(options = {}) {
    super(options);
    this.running = false;

    if (this.options.topology !== false) {
      this.addObserver('staticTopologyObserver', staticToplogyObserver);
    }

    if (this.options.signalflow !== false) {
      this.addObserver('signalFlowObserver', signalFlowObserver);
    }

    this.clientId = this.options.clientId || 'collar-dev-client' + new Date().getTime();
    this.clientSecret = this.options.clientSecret || '';
  }

  run() {
    var self = this;

    if (this.running) return;
    this.running = true;

    let url = this.options.url || 'ws://localhost:7500';
    if (url.charAt(url.length-1) === "/") {
      url = url.slice(0, -1);
    }
    let interval = this.options.interval || 1000;
    let framesize = this.options.framesize || 10;

    const client = new Client(url + '/app', this.clientId, this.clientSecret);

    client.on('unauthorized', function() {
      console.error("Unauthorized socket io connection:");
    });

    client.on('authorized', function(socket) {
      console.log("connected to dev server");
      function send(msg, data) {
        socket.emit(msg, data);
      }

      send("new model", {
        process: self.options.process
      });

      let idle = 0;
      var interval = setInterval(() => {
        let elemToBeSent = [];
        let signalToBeSent = [];

        if (elements.length >= framesize) {
          elemToBeSent = elements.splice(0, framesize);
          elemToBeSent.forEach((elem) => {
            elem.data.process = self.options.process || '__anonymous__';
          });
        } else {
          elements.forEach((elem) => {
            elem.data.process = self.options.process || '__anonymous__';
            elemToBeSent.push(elem);
          });
          elements = [];
        }

        if (signals.length > framesize) {
          signalToBeSent = signals.splice(0, framesize);
        } else {
          signals.forEach((signal) => {
            signalToBeSent.push(signal);
          });
          signals = [];
        }

        if (elemToBeSent.length > 0) {
          send("append elements", {
            elements : elemToBeSent
          });
        }

        if (signalToBeSent.length > 0) {
          send("append signals", {
            signals : signalToBeSent
          });
        }
      }, interval);

      socket.on('push', (data) => {
        var id = data.nodeId;
        if (nodes.hasOwnProperty(id)) {
          nodes[id].push(data.signal.payload);
        } else {
          console.error("[DEV] Failed to push signal to node, node id does not exist:", id);
        }
      });

      socket.on('send', (data) => {
        var id = data.nodeId;
        if (nodes.hasOwnProperty(id)) {
          nodes[id].send(data.signal.payload);
        } else {
          console.error("[DEV] Failed to emit signal from node, node id does not exist:", id);
        }
      });
    });

    client.connect();
  }
}

module.exports = DevToolAddon;

