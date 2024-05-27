const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const webpack = require('webpack')

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Output Management',
      filename: 'index.html',
      template: 'index.html'
    }),
    new WebpackManifestPlugin({}),
    new webpack.ProvidePlugin({
		Buffer: ['buffer', 'Buffer'],  // ...
	})
  ],
  resolve: {
      extensions: ['.ts', '.js', '.json', '.gts', '.gjs'],
    },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
   module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
       {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
        {
          test: /\.(js|mjs|ts|gts|gjs)$/,
          use: ['babel-loader', '@glimmerx/webpack-loader'],
        },
    ]
  },
};