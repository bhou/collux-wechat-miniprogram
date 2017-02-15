import Constants from '../Constants';

export default function home(page) {

  page.when('ON_LOAD')
    .actuator('get user info', (s, done) => {
      getApp().getUserInfo((error, user) => {
        done(error, user)
      });
    })
    .map('set state', s => {
      return s.set(Constants.STATE, s.getResult());
    })
    .to(page.viewUpdater);

  page.when('ON_CLICK_TEST')
    .map('set url', s => {
      return s.set(Constants.URL, '/pages/test/test');
    })
    .to(page.navigate);

  page.when('ON_CLICK_ABOUT')
    .map('set url', s => {
      return s.set(Constants.URL, '/pages/about/about');
    })
    .to(page.navigate);

  page.when('ON_CLICK_HELLO_WORLD')
    .map('set url', s => {
      return s.set(Constants.URL, '/pages/helloworld/helloworld');
    })
    .to(page.navigate);

  return page;
}