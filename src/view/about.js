import Constants from '../Constants';

export default function view(page) {
  // 添加消息处理数据流
  page.when('ON_SHOW_SYS_INFO')
    .actuator('get system info', (s, done) => {
      wx.getSystemInfo({
        success: function(res) {
          done(null, res);
        }
      })
    })
    .map('set state', s => {
      return s.set(Constants.STATE, s.getResult());
    })
    .to(page.viewUpdater);

  return page;
}
