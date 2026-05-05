module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@contexts': './src/contexts',
          '@hooks': './src/hooks',
          '@types': './src/types',
        },
      },
    ],
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
  ],
  env: {
    production: {
      plugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
      ],
    },
  },
};
