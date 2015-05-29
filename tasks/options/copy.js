module.exports = function() {

    return {
        coverage: {
            src:    [ 'test/**/*.*' ],
            dest:   'coverage/'
        }

      , client: {
            files: {
                'dist/index.html': [ './lib/index.html' ]
            }
        }

      , docker: {
            files: [
              {
                expand: true,
                cwd: './lib/server/',
                src: [ '**/*.*' ],
                dest: 'bundle/node/'
              },
              { 'bundle/node/client/index.html': './dist/index.html' },
              { 'bundle/node/client/app.js':     './dist/app.js' }
            ]
        }
    };

};
