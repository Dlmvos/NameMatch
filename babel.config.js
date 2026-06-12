module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strips ALL console.* calls in production (default behavior — no
      // `exclude` option set, so error/warn are stripped too). This is the
      // intended posture: no Sentry/Crashlytics is wired up, so prod
      // console.error/warn would be invisible anyway, and stripping them
      // prevents any interpolated data from shipping in the bundle.
      // If a crash sink is added later, switch to:
      //   ['transform-remove-console', { exclude: ['error', 'warn'] }]
      process.env.NODE_ENV === 'production' && 'transform-remove-console',
      'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
};
