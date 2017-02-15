import biz from '../../lib/bundle';
// 获得这个view的sensor，用来发送消息
const viewSensor = biz.getViewSensor('counter');

Page({
  data: {
    count: 0
  },
  onIncrement: () => {
    viewSensor.send('ON_INCREMENT');
  },
  onDecrement: () => {
    viewSensor.send('ON_DECREMENT');
  }
});