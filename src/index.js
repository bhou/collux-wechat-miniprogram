import collux from './collux';
import home from './view/home';

// 发布小程序的时候，请注释以下代码，
import DevToolAddon from './devtool/DevToolAddon';
collux.use(new DevToolAddon({
  process: 'wechatapp',
}));

const app = collux.createApp('your app name');

// 在这里添加新的view
app.route('home', home);

export default app;