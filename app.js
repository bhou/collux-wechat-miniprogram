import app from './lib/bundle';

//app.js
App({
  onLaunch: function () {
  },
  getUserInfo:function(cb){
    var that = this;
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(null, this.globalData.userInfo);
    } else {
      //调用登录接口
      wx.login({
        success: function (res) {
          console.log(res);
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo;
              typeof cb == "function" && cb(null,that.globalData.userInfo);
            }
          })
        },
        fail: function() {
          cb(new Error('登陆接口调用出错！'))
        }
      })
    }
  },
  globalData:{
    userInfo: null
  }
});
