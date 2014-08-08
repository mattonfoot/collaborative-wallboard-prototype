var literalify = require('literalify');

module.exports = function() {
    return {

        test: {
            files: {
                'browser/test.js': [ 'test/*.js' ]
            }
        },

        src: {
            options: {
                transform: [
                    literalify.configure({
                        'jquery': 'window.$'
                    })
                ]
            }

          , files: {
                'dist/app.js': [ './lib/main.js' ]
            }
        }
    };
};
