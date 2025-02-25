import type { StorybookConfig } from '@storybook/html-webpack5'
const path = require('path')
const util = require('util')

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-webpack5-compiler-swc',
        '@storybook/addon-essentials',
        '@chromatic-com/storybook',
        '@storybook/addon-interactions',
        {
            name: '@storybook/addon-styling-webpack',
            options: {
                rules: [
                    // Replaces existing CSS rules with given rule
                    {
                        test: /\.css$/,
                        use: [
                            'style-loader',
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                                options: {
                                    postcssOptions: {
                                        config: path.resolve(
                                            __dirname,
                                            '..',
                                            'postcss.config.js'
                                        ),
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        },
    ],
    framework: {
        name: '@storybook/html-webpack5',
        options: {},
    },
    core: {
        disableTelemetry: true, // 👈 Disables telemetry
    },
    webpackFinal: async (config) => {
        let addedConfig = {
            ...config,
            module: {
                ...config.module,
                rules: [
                    ...config.module.rules,
                    {
                        test: /\.(js|mjs|ts|gts|gjs)$/,
                        use: ['babel-loader', '@glimmerx/webpack-loader'],
                    },
                ],
            },
        }
        return addedConfig
    },
}
export default config
