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

  return page;
}