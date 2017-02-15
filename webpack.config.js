// webpack.config.js

var path = require('path');
var webpack = require('webpack');

var jsLoader = {
  test: /\.js$/, 
  loader: 'babel',
  query: {
    presets: ["es2015"]
  },
  include: path.join(__dirname, 'src'),
  exclude: path.join(__dirname, 'node_modules')
}

module.exports = {
  // sourcemap 选项, 建议开发时包含sourcemap, production版本时去掉(节能减排)
  devtool: null,

  // 指定es6目录为context目录, 这样在下面的entry, output部分就可以少些几个`../`了
  context: path.join(__dirname, 'src'),

  // 定义要打包的文件
  // 比如: `{entry: {out: ['./x', './y','./z']}}` 的意思是: 将x,y,z等这些文件打包成一个文件,取名为: out
  // 具体请参看webpack文档
  entry: {
    bundle: './index',
  },

  output: {
    // 将打包后的文件输出到lib目录
    path: path.join(__dirname, 'lib'),

    // 将打包后的文件命名为 myapp, `[name]`可以理解为模板变量
    filename: '[name].js',

    // module规范为 `umd`, 兼容commonjs和amd, 具体请参看webpack文档
    libraryTarget: 'umd'
  },

  module: {
    loaders: [jsLoader]
  },

  resolve: {
    extensions: ['', '.js'],
    // 将es6目录指定为加载目录, 这样在require/import时就会自动在这个目录下resolve文件(可以省去不少../)
    modulesDirectories: ['src', 'node_modules']
  },

  plugins: [
    new webpack.NoErrorsPlugin(),

    // 通常会需要区分dev和production, 建议定义这个变量
    // 编译后会在global中定义`process.env`这个Object
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    })
  ]
};


