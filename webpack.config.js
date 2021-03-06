const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HTMLMinifier = require('html-minifier');
const jsonminify = require('jsonminify');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const copyHotLoaderFiles = new CopyWebpackPlugin(
	[
		{
			from: { glob: '**/*.+(html|json|png|svg|jpg|jpeg|gif|ttf|woff|eot)' },
			context: 'src/hot-loader',
			to: './[path]/[name].[ext]',
		},
	],
	{
		ignore: [{ glob: '**/_*/**' }, { glob: '**/_*' }],
	},
);

const copyFiles = new CopyWebpackPlugin(
	[
		{
			from: { glob: '**/*.+(html|php|json|png|svg|jpg|jpeg|gif|ttf|woff|eot)' },
			context: 'src',
			to: './[path]/[name].[ext]',
			transform: (fileContents, filepath) => {
				// get file extension
				const fileExt = filepath
					.split('.')
					.pop()
					.toLowerCase();

				// minify HTML
				switch (fileExt) {
					case 'html':
						return HTMLMinifier.minify(fileContents.toString(), {
							collapseWhitespace: true,
							collapseInlineTagWhitespace: true,
							minifyCSS: true,
							minifyJS: true,
							removeComments: true,
							removeRedundantAttributes: true,
						});
					case 'json':
						return jsonminify(fileContents.toString());

					default:
						return fileContents;
				}
			},
		},
	],
	{
		ignore: [{ glob: '**/_*/**' }, { glob: '**/_*' }, 'index.html'],
	},
);

const copyIndexHtmlFile = isHotLoaderEnv =>
	new CopyWebpackPlugin([
		{
			from: 'src/index.html',
			to: './index.html',
			transform: fileContents => {
				const html = fileContents.toString();

				const injectStylesheetTag = isHotLoaderEnv
					? html
					: html.replace(/<\/head>/, '<link rel="stylesheet" href="bundle.css"/>');

				const minify = isHotLoaderEnv
					? html
					: HTMLMinifier.minify(injectStylesheetTag, {
							collapseWhitespace: true,
							collapseInlineTagWhitespace: true,
							minifyCSS: true,
							minifyJS: true,
							removeComments: true,
							removeRedundantAttributes: true,
					  });

				return minify;
			},
		},
	]);

const extractCssGenerator = isHotLoaderEnv =>
	new ExtractTextPlugin({
		filename(getPath) {
			return getPath('[name].css');
		},
		...(isHotLoaderEnv ? { disable: true } : {}),
	});

module.exports = env => {
	const analyzeBuild = env && env.analyze;
	const isHotLoaderEnv = env && env.hot;
	const extractCss = extractCssGenerator(isHotLoaderEnv);

	return {
		mode: isHotLoaderEnv ? 'development' : 'production',
		...(isHotLoaderEnv ? { devtool: 'source-map' } : {}),
		entry: {
			bundle: isHotLoaderEnv
				? ['babel-polyfill', 'react-hot-loader/patch', './src/entry', './src/entry.scss']
				: ['./src/entry', './src/entry.scss'],
		},
		devServer: {
			// eslint-disable-next-line no-undef
			contentBase: path.join(__dirname, 'build'),
			hotOnly: true,
			compress: true,
			port: 9033,
			host: 'localhost',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
			},
		},
		output: {
			// eslint-disable-next-line no-undef
			path: path.resolve(__dirname, 'build'),
			filename: '[name].js',
			publicPath: 'http://localhost:9033/',
		},
		plugins: [
			extractCss,
			copyFiles,
			copyIndexHtmlFile(isHotLoaderEnv),
			...(isHotLoaderEnv
				? [copyHotLoaderFiles]
				: [
						new ImageminPlugin(),
						new CleanWebpackPlugin('build'),
						new OptimizeCssAssetsPlugin({
							assetNameRegExp: /\.(scss|css)$/g,
						}),
						new UglifyJSPlugin({
							uglifyOptions: {
								compress: true,
								output: {
									comments: false,
								},
							},
						}),
						...(analyzeBuild ? [new BundleAnalyzerPlugin()] : []),
				  ]),
		],
		module: {
			rules: [
				{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
				{ test: /\.md/, exclude: /node_modules/, loader: ['babel-loader', 'axe-markdown-loader'] },
				{
					test: /\.(png|jpg|jpeg|gif|ttf|woff|eot)$/,
					loader: 'url-loader',
				},
				{
					test: /\.(svg)$/,
					loader: 'svg-react-loader',
				},
				{
					test: /\.(scss)$/,
					loader: extractCss.extract({
						use: [
							{
								loader: 'css-loader',
								options: {
									root: './',
								},
							},
							'sass-loader',
						],
						fallback: 'style-loader',
					}),
					exclude: /themes/,
				},
			],
		},
		resolve: {
			alias: {
				react: path.resolve('node_modules/react'),
				'react-dom': path.resolve('node_modules/react-dom'),
				'prop-types$': path.resolve('node_modules/axe-prop-types'),
			},
		},
	};
};
