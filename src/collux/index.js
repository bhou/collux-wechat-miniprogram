import collar from './collar.min.v1.0.0';
import Constants from '../Constants';

function createModule(name) {
  const ns = collar.ns(name, {arch: name});
  const input = ns.input(`${name} input`);
  const output = ns.output(`${name} output`);
  return {
    name,
    ns,
    input,
    output
  }
}

function createApp(name) {
  const app = createModule(`WeApp`);
  const sensor = app.ns.sensor('view sensor', function() {});
  sensor.to(app.input);

  const sysMsgInput = app.input.when('system msg', s => s.get(Constants.MSG_TYPE) === Constants.SYS_MSG);
  const pageMsgInput = app.input.when('page msg', s => s.get(Constants.MSG_TYPE) === Constants.PAGE_MSG);

  // view updater pipeline
  sysMsgInput.when('state changed', s => s.get(Constants.MSG) === Constants.MSG_STATE_CHANGED)
    .do(`update page`, s => {
      let state = s.get(Constants.STATE);
      let pages = getCurrentPages();
      let currentPage = pages[pages.length-1];
      currentPage.setData(state);
    })
    .to(app.output);

  sysMsgInput.when('redirect to', s => s.get(Constants.MSG) === Constants.MSG_REDIRECT)
    .do(`redirect to page`, s => {
      let url = s.get(Constants.URL);
      wx.redirectTo({url});
    })
    .to(app.output);

  sysMsgInput.when('redirect to', s => s.get(Constants.MSG) === Constants.MSG_NAVIGATE)
    .do(`navigate to page`, s => {
      let url = s.get(Constants.URL);
      wx.navigateTo({url});
    })
    .to(app.output);

  sysMsgInput.when('switch to', s => s.get(Constants.MSG) === Constants.MSG_SWITCH_TAB)
    .do(`navigate to page`, s => {
      let url = s.get(Constants.URL);
      wx.switchTab({url});
    })
    .to(app.output);

  const views = new Map();

  function getViewSensor(page) {
    if (!page) return null;
    return {
      send(msg, data) {
        let payload = {};
        let pages = getCurrentPages();
        let currentPage = pages[pages.length-1] || {};
        payload[Constants.MSG_TYPE] = Constants.PAGE_MSG;
        payload[Constants.MSG] = msg;
        payload[Constants.PAGE] = page;
        payload[Constants.DATA] = data;
        payload[Constants.STATE] = currentPage.data;
        sensor.send(payload);
      }
    }
  }

  function addView(name) {
    let viewModule = createModule(name);

    if (!views.has(name)) {
      pageMsgInput
        .when(`/${name}`, s => s.get(Constants.PAGE) === name)
        .to(viewModule.input);
      views.set(name, viewModule);
    }
    return views.get(name);
  }

  function getView(name) {
    return views.get(name);
  }

  function route(name, viewModule) {
    const view = addView(name);

    function when(msg) {
      return view.input.when(msg, s => s.get(Constants.MSG) === msg);
    }

    let viewStateUpdaterInstance = null;
    function getViewStateUpdater(name) {
      let view = getView(name);
      let page = view.name;

      if (!viewStateUpdaterInstance) {
        viewStateUpdaterInstance = view.ns.map('prepare view updater', s => {
          return s.set(Constants.MSG_TYPE, Constants.SYS_MSG)
            .set(Constants.MSG, Constants.MSG_STATE_CHANGED);
        });
        viewStateUpdaterInstance.through(`update ${page} page`, app.input, app.output, true)
          .errors(s => {
            console.error(s.error);
          });
      }
      return viewStateUpdaterInstance;
    }

    let redirectInstance = null;
    function getRedirectActuator(name) {
      let view = getView(name);
      if (!redirectInstance) {
        redirectInstance = view.ns.map('prepare view redirection', s => {
          return s.set(Constants.MSG_TYPE, Constants.SYS_MSG)
            .set(Constants.MSG, Constants.MSG_REDIRECT);
        });
        redirectInstance.through(`redirect`, app.input, app.output, true)
          .errors(s => {
            console.error(s.error);
          });
      }
      return redirectInstance;
    }

    let navigateInstance = null;
    function getNavigateActuator(name) {
      let view = getView(name);

      if (!navigateInstance) {
        navigateInstance = view.ns.map('prepare view navigation', s => {
          return s.set(Constants.MSG_TYPE, Constants.SYS_MSG)
            .set(Constants.MSG, Constants.MSG_NAVIGATE);
        });
        navigateInstance.through(`navigate`, app.input, app.output, true)
          .errors(s => {
            console.error(s.error);
          });
      }
      return navigateInstance;
    }

    let switchTabInstance = null;
    function getSwitchTabActuator(name) {
      let view = getView(name);

      if (!switchTabInstance) {
        switchTabInstance = view.ns.map('prepare tab switch', s => {
          return s.set(Constants.MSG_TYPE, Constants.SYS_MSG)
            .set(Constants.MSG, Constants.MSG_SWITCH_TAB);
        });
        switchTabInstance.through(`switch tab`, app.input, app.output, true)
          .errors(s => {
            console.error(s.error);
          });
      }
      return switchTabInstance;
    }

    viewModule({
      ns: view.ns,
      input: view.input,
      when,
      sensor: getViewSensor(name),
      viewUpdater: getViewStateUpdater(name),
      navigate: getNavigateActuator(name),
      redirect: getRedirectActuator(name),
      switchTab: getSwitchTabActuator(name),
      getNavigateActuator,
      getRedirectActuator,
    });
  }

  return {
    getViewSensor,
    addView,
    getView,
    route,
  };
}

// other utils
function use(addon) {
  collar.use(addon);
}

export default {
  createApp,
  use,
}