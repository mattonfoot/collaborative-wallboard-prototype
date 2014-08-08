module.exports = function() {

    return {
        coverage: {
            src:    [ 'test/**' ],
            dest:   'coverage/'
        }

      , client: {
            files: {
                'dist/index.html': [ './lib/index.html' ]
            }
        }
    };

};
