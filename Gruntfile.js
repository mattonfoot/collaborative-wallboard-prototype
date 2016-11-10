const glob = require( 'glob' );

const registerCustomGruntTasks = (grunt) => {
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

// helper function to load task configs
const loadConfig = (path, config) => {
  var o = {};

  glob.sync('*', { cwd: path }).forEach(function( option ) {
    o[ option.replace( /\.js$/, '' ) ] = require( path + option )( config );
  });

  return o;
};

module.exports = (grunt) => {
    'use strict';

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

    registerCustomGruntTasks(grunt);
};
