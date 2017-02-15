import Constants from '../Constants';

export default function view(page) {
  // 添加消息处理数据流
  page.when('ON_SHOW')
    .map('init state', s => {
      return s.set(Constants.STATE, {clicked : false});
    })
    .to(page.viewUpdater);

  page.when('ON_SHOW_GREETING')
    .actuator('show greeting', (s, done) => {
      wx.showModal({
        title: '提示',
        content: '您好！',
        success: function(res) {
          if (res.confirm) {
            done();
          }
        }
      })
    })
    .map('set state', s => {
      return s.set(Constants.STATE, {clicked : true});
    })
    .to(page.viewUpdater);
  return page;
}

