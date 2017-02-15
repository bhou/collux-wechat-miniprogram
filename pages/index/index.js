import biz from '../../lib/bundle';
// 获得这个view的sensor，用来发送消息
const viewSensor = biz.getViewSensor('home');

Page({
  data: {
  },
  onLoad: () => {
    // 发送加载消息
    viewSensor.send('ON_LOAD');
  },
  onClickTest: () => {
    viewSensor.send('ON_CLICK_TEST');
  },
  onClickAbout: () => {
    viewSensor.send('ON_CLICK_ABOUT');
  },
  onClickHelloWorld: () => {
    viewSensor.send('ON_CLICK_HELLO_WORLD');
  }
});
