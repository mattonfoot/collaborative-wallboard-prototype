module.exports = function( grunt ) {
    'use strict';

    // helper function to load task configs

    function loadConfig( path, config ) {
        var glob = require( 'glob' );

        var object = {}
          , key;

        glob.sync('*', { cwd: path })
            .forEach(function( option ) {
                key = option.replace( /\.js$/, '' );
                object[key] = require( path + option )( config );
            });

        return object;
    }

    // actual config

    var config = {
        pkg: grunt.file.readJSON('package.json')
      , env: process.env
      , __dirname: __dirname
    };

    grunt.util._.extend(config, loadConfig( './tasks/options/', config ));

    grunt.initConfig(config);

    // load grunt tasks
    require('load-grunt-tasks')(grunt);

    // local tasks
    grunt.loadTasks('tasks');

    // clean
    // grunt.registerTask('clean'     , [ 'clean' ]);

    // test
    grunt.registerTask('coverage'     , [ 'clean:coverage', 'blanket', 'copy:coverage', 'mochaTest:instrumented', 'mochaTest:lcov', 'mochaTest:coverage' ]);
    grunt.registerTask('test'         , [ /*'jshint', 'eslint',*/ 'mochaTest:test' ]);

    // build
    grunt.registerTask('build'        , [ 'browserify', 'copy:client' ]);
    grunt.registerTask('build:test'   , [ 'browserify:test' ]);
    grunt.registerTask('rebuild'      , [ 'clean', 'build' ]);

    // auto build
    // grunt.registerTask('default'   , [ 'watch' ]);

    // docker containers
    grunt.registerTask('dock'         , [ 'dock:dev:build', 'dock:dev:start' ]);

    // local dev servers
    grunt.registerTask('serve'        , [ 'rebuild', 'nodemon:dev' ]);
    grunt.registerTask('serve:local'  , [ 'rebuild', 'nodemon:local' ]);

    // travis-ci
    grunt.registerTask('ci'           , [ 'coverage', 'coveralls' ]);

};
