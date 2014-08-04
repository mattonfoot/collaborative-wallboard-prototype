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

      , coverage: {
            options: {
                reporter: 'html-cov'
              , quiet: true
              , captureFile: 'reports/coverage.html'
            }

          , src: coverage
        }

      , lcov: {
            options: {
              reporter: 'mocha-lcov-reporter',
              quiet: true,
              captureFile: 'reports/lcov.info'
            },
            src: coverage
        }

      , 'travis-cov': {
            options: {
                reporter: 'travis-cov'
            }

          , src: coverage
        }

    };

};
