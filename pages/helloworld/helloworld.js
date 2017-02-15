import biz from '../../lib/bundle';
// 获得这个view的sensor，用来发送消息
const viewSensor = biz.getViewSensor('helloworld');

Page({
  data: {
  },
  onShowGreeting: () => {
    viewSensor.send('ON_SHOW_GREETING');
  }
});