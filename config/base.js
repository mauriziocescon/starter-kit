// tslint:disable:object-literal-sort-keys max-line-length no-console
const webpack = require("webpack");
const path = require("path");
const CleanPlugin = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const StyleLintPlugin = require("stylelint-webpack-plugin");

module.exports = (env) => {
    return {

        entry: {
            app: "./src/main.ts",
            vendor: "./src/vendor.ts",
        },

        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        resolve: {
            // Add ".ts" and ".tsx" as a resolvable extension.
            extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".scss", ".html", ".json"],
        },

        plugins: [

            // environment variables
            new webpack.NormalModuleReplacementPlugin(/\/environments\/environment/, (resource) => {
                const newResource = `environments/environment${env.name === "dev" ? "" : `.${env.name}`}`;
                resource.request = resource.request.replace("environments/environment", newResource);
            }),

            // scope hoisting
            new webpack.optimize.ModuleConcatenationPlugin(),

            // clean dist folder
            new CleanPlugin(["dist", "build"], {
                root: path.resolve(__dirname, "../"),
                verbose: true,
                dry: false,
                exclude: [],
            }),

            new CopyPlugin([{
                from: "src/index.html",
            }, {
                from: "src/manifest.json",
            }, {
                from: "src/assets/i18n", to: "assets/i18n",
            }, {
                from: "src/assets/imgs", to: "assets/imgs",
            }]),

            // Automatically load modules instead of
            // having to import or require them everywhere
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery",
            }),

            new ForkTsCheckerWebpackPlugin({
                checkSyntacticErrors: true,
                tslint: true,
                watch: ["./src/"], // optional but improves performance (less stat calls)
            }),

            // avoid processing *.scss.d.ts
            new webpack.WatchIgnorePlugin([
                /css\.d\.ts$/,
            ]),

            // insert file dynamically
            new HtmlWebpackPlugin({
                template: "src/index.html",
                inject: "head",
            }),

            new webpack.optimize.CommonsChunkPlugin({
                name: "vendor",
                minChunks: (module) => {
                    // this assumes your vendor imports exist in the node_modules directory
                    return module.context && module.context.indexOf("node_modules") !== -1;
                },
            }),

            new StyleLintPlugin(),
        ],

        module: {

            rules: [

                // template loaders
                {
                    test: /\.html?$/,
                    exclude: /index.html$/,
                    use: [
                        {loader: "html-loader", options: {exportAsEs6Default: true, minimize: true}},
                    ],
                },

                // all files with ".js .ts .tsx" extensions will be handled by ts-loader
                {
                    test: /\.(js|ts|tsx)?$/,
                    exclude: [/node_modules/],
                    use: [
                        {loader: "cache-loader"},
                        // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                        {loader: "thread-loader", options: {workers: require("os").cpus().length - 1}},
                        {loader: "babel-loader", options: {cacheDirectory: true}},
                        {loader: "ts-loader", options: {happyPackMode: true}},
                    ],
                },

                // preprocess
                {
                    test: /\.(js|ts|tsx)?$/,
                    exclude: [/node_modules/],
                    enforce: "pre",
                    use: [
                        {loader: "preprocess-loader", options: {}},
                    ],
                },

                // All output ".js" files will have any sourcemaps re-processed by "source-map-loader".
                {
                    test: /\.js$/,
                    enforce: "pre",
                    use: [
                        {loader: "source-map-loader"},
                    ],
                },

                // add jQuery to the global object
                {
                    test: require.resolve("jquery"),
                    use: [
                        {loader: "expose-loader", options: "jQuery"},
                        {loader: "expose-loader", options: "$"},
                    ],
                },

                // add Popper to the global object
                {
                    test: require.resolve("popper.js"),
                    use: [
                        {loader: "expose-loader", options: "Popper"},
                    ],
                },
            ],
        },
    };
};
