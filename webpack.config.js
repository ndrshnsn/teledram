let path = require('path');
let webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    devtool: 'source-map',
    entry: {
        widget: [
            path.join(__dirname, 'src', 'widget', 'widget-index.js')
        ],
        chat: [
            path.join(__dirname, 'src', 'chat', 'chat-index.js')
        ],
    },
    output: {
        path: path.join(__dirname, 'dist', 'js'),
        filename: '[name].js',
        publicPath: '/js/'
    },
    module: {
        rules: [
            { test: /\.js$/, use: { loader: "babel-loader" }, include: path.join(__dirname, 'src') },
            { test: /\.css$/, use: ['style-loader', 'css-loader', 'sass-loader'], include: path.join(__dirname, 'css') },
        ]
    },
    optimization: {
	minimize: true,
	minimizer: [new TerserPlugin()],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ]
};
