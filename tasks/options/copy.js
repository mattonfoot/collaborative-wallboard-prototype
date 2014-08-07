module.exports = function( config ) {

    return {
        coverage: {
            src: ['test/**'],
            dest: 'coverage/'
        }

      , client: {
            files: {
                'dist/index.html': [ './lib/index.html' ]
            }
        }
    };

};
