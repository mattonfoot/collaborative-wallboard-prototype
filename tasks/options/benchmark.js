module.exports = function() {

    return {

        options: {
            // This can also be set inside specific tests.
            displayResults: true
        }

      , all: {
            src:  [ 'benchmarks/*.js' ],
            dest: 'reports/benchmarks.csv'
        }

    };
};
