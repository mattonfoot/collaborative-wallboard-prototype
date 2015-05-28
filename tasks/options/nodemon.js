module.exports = function( config ) {

    return {
      options: {
        callback: function ( nodemon ) {
          nodemon.on('log', function ( event ) {
            console.log( event.colour );
          });
        },
        cwd: __dirname + '/../../',
        ignore: [
          'node_modules/**',
          'tasks',
          'test',
          'designs',
          'reports',
          'dist',
          'coverage',
          'browser'
        ],
        ext: 'js',
        watch: [ 'lib' ],
        delay: 500,
        legacyWatch: true
      },

      dev: {
        options: {
          nodeArgs: [ '--debug' ],
          env: {
            PORT: config.env.PORT || '9001',
            HOST: config.env.HOST || '0.0.0.0',
            COUCH: 'https://vuuse.smileupps.com',
            CHANNEL: 'vuuse',
            SERVERID: 'dev'
          }
        },
        script: './lib/server'
      }

    };

};
