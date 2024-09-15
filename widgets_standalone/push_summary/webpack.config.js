const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = [
    {
        entry: {
            app: './src/app.js',
        },
        mode:
            process.env.NODE_ENV === 'production'
                ? 'production'
                : 'development',
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Integrated app',
                filename: 'index.html',
                template: 'index.html',
            }),
            new CopyPlugin({
                patterns: [{ from: 'vendor', to: 'vendor' }],
            }),

            new WebpackManifestPlugin({}),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        resolve: {
            extensions: ['.ts', '.js', '.json', '.gts', '.gjs'],
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
        },

        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    config: path.resolve(
                                        __dirname,
                                        'postcss.config.js'
                                    ),
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(js|mjs|ts|gts|gjs)$/,
                    use: ['babel-loader', '@glimmerx/webpack-loader'],
                },
            ],
        },
    },
    {
        entry: {
            standalone: './src/standalone.js',
        },
        experiments: {
            outputModule: true,
        },
        devServer: {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
  }
},
        mode:
            process.env.NODE_ENV === 'production'
                ? 'production'
                : 'development',
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Standalone',
                filename: 'standalone.html',
                template: 'standalone.html',
                inject: false,
                scriptLoading: 'module',
            }),
            new CopyPlugin({
                patterns: [{ from: 'vendor', to: 'vendor' }],
            }),

            new WebpackManifestPlugin({}),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        resolve: {
            extensions: ['.ts', '.js', '.json', '.gts', '.gjs'],
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            library: {
                type: 'module',
            },
        },

        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    config: path.resolve(
                                        __dirname,
                                        'postcss.standalone.js'
                                    ),
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(js|mjs|ts|gts|gjs)$/,
                    use: ['babel-loader', '@glimmerx/webpack-loader'],
                },
            ],
        },
    },
]
