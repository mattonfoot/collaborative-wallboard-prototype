var mocha = require('mocha');

module.exports = function( config ) {

    var tests = ['tests/all.html'];
    var coverage = ['browser/coverage.js'];

    var configSlow = 75;
    var configTimeout = 2000;

    return {

        test: {
            options: {
                reporter: 'Spec'
              , slow: configSlow
              , timeout: configTimeout
              , run: true
              , logErrors: true
            }

          , src: tests
        }
/*
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
    */

    };
};
