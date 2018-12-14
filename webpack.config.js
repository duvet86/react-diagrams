const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

const plugins = [];
const production = process.env.NODE_ENV === "production";

// Do we minify it all.
if (production) {
	console.log("creating production build");
	plugins.push(
		new webpack.DefinePlugin({
			"process.env.NODE_ENV": '"production"'
		})
	);
}

/**
 * @author Dylan Vorster
 */
module.exports = {
	entry: "./src/main.ts",
	output: {
		filename: "main.js",
		path: __dirname + "/dist",
		libraryTarget: "umd",
		library: "storm-react-diagrams"
	},
	externals: {
		react: {
			root: "React",
			commonjs2: "react",
			commonjs: "react",
			amd: "react"
		},
		"react-dom": {
			root: "ReactDOM",
			commonjs2: "react-dom",
			commonjs: "react-dom",
			amd: "react-dom"
		},
		lodash: {
			commonjs: "lodash",
			commonjs2: "lodash",
			amd: "_",
			root: "_"
		}
	},
	plugins: plugins,
	module: {
		rules: [
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader"
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader"
			}
		]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"]
	},
	devtool: production ? "source-map" : "cheap-module-source-map",
	mode: production ? "production" : "development",
	optimization: {
		minimizer: [
			new TerserPlugin({
				sourceMap: true,
				parallel: true,
				cache: true
			})
		]
	}
};
