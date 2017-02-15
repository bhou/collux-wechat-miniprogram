import Constants from '../Constants';

export default function view(page) {
  // 添加消息处理数据流
  page.when('ON_INCREMENT')
    .map('increase counter', s => {
      let state = s.get(Constants.STATE);
      return s.set(Constants.STATE, {
        count: state.count + 1
      });
    })
    .to(page.viewUpdater);

  page.when('ON_DECREMENT')
    .map('decrease counter', s => {
      let state = s.get(Constants.STATE);
      return s.set(Constants.STATE, {
        count: state.count - 1
      })
    })
    .to(page.viewUpdater);
  return page;
}
