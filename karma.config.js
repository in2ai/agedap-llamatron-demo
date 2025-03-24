module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-chrome-launcher'),
      require('karma-spec-reporter'),
      require('karma-coverage'),
    ],
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
      thresholds: { statements: 80, lines: 80, branches: 80, functions: 80 },
    },
    reporters: ['progress', 'spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: ['--no-sandbox', '--headless', '--disable-gpu', '--remote-debugging-port=9222'],
      },
    },
  });
};
