import biz from '../../lib/bundle';
// 获得这个view的sensor，用来发送消息
const viewSensor = biz.getViewSensor('home');

Page({
  data: {
  },
  onLoad: () => {
    // 发送加载消息
    viewSensor.send('ON_LOAD');
  }
});
