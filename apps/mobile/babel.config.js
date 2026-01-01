const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@/mobile': './',
            '@/core': path.resolve(__dirname, '../../packages/core/src'),
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.tsx', '.ts'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
