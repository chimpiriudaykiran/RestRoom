const path = require('path');

module.exports = {
  // other webpack configurations...

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /@googlemaps/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
