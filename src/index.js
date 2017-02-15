import collux from './collux';
import home from './view/home';
import counter from './view/counter';
import about from './view/about';
import helloworld from './view/helloworld';

// 发布小程序的时候，请注释以下代码，
import DevToolAddon from './devtool/DevToolAddon';
collux.use(new DevToolAddon({
  process: 'wechatapp',
}));

const app = collux.createApp('your app name');

// 在这里添加新的view
app.route('home', home);
app.route('counter', counter);
app.route('about', about);
app.route('helloworld', helloworld);

export default app;