module.exports = function() {

    return {

        src: {
            files: 'lib/**/*.js',
            tasks: [ 'test', 'build' ]
        }

      , test: {
            files: 'test/**/*.js',
            tasks: [ 'test' ]
        }
    };

};
