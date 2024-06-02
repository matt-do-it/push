const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    app: "./src/app.js",
    standalone: {
    	import: "./src/standalone.js",
    	library: {
			type: "module"
    	}

    }},
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  experiments: {
    outputModule: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Integrated app",
      filename: "index.html",
      template: "index.html",
      chunks: ["app"],
    }),
    new HtmlWebpackPlugin({
      title: "Output Management",
      filename: "standalone.html",
      template: "standalone.html",
      inject: false,
      scriptLoading: "module",
      chunks: ["standalone"],
    }),
    new CopyPlugin({
      patterns: [{ from: "vendor", to: "vendor" }],
    }),

    new WebpackManifestPlugin({}),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"], // ...
    }),
  ],
  resolve: {
    extensions: [".ts", ".js", ".json", ".gts", ".gjs"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(js|mjs|ts|gts|gjs)$/,
        use: ["babel-loader", "@glimmerx/webpack-loader"],
      },
    ],
  },
};
