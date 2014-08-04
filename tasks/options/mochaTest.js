var mocha = require('mocha');

module.exports = function( config ) {

    var tests = ['test/**/*.js'];
    var coverage = ['coverage/test/**/*.js'];

    var configSlow = 500;
    var configTimeout = 6000;

    return {

        test: {
            options: {
                reporter: 'spec'
              , slow: configSlow
              , timeout: configTimeout
            }

          , src: tests
        }

      , instrumented: {
            options: {
                reporter: 'spec'
              , slow: configSlow
              , timeout: configTimeout
            }

          , src: coverage
        }

      , lcov: {
            options: {
                reporter: 'mocha-lcov-reporter',
              , captureFile: 'reports/lcov.info'
            },
            src: coverage
        }

      , coverage: {
            options: {
                reporter: 'html-cov'
              , captureFile: 'reports/coverage.html'
            }

          , src: coverage
        }

    };

};
