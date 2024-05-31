/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

// eslint-disable-next-line no-undef
module.exports = {
  // CLI Bundling
  target: "node",

  // bundling mode
  mode: "production",

  // entry files
  entry: "./cli/index.ts",

  // output bundles (location)
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },

  // file resolutions
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  // loaders
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  devtool: "source-map",

  plugins: [
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
    function () {
      this.hooks.done.tapPromise("Make executable", async () => {
        fs.chmodSync(`${__dirname}/dist/main.js`, "755");
      });
    },
  ],
};
