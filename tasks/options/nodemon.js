module.exports = function() {

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

      server: {
        options: {
          env: {
            PORT: '8080',
            HOST: '0.0.0.0',
            COUCH: 'https://vuuse.smileupps.com',
            CHANNEL: 'vuuse',
            SERVERID: '0001'
          }
        },
        script: './lib/server'
      },

      dev: {
        options: {
          nodeArgs: [ '--debug' ],
          env: {
            PORT: '9001',
            HOST: '0.0.0.0',
            COUCH: 'https://vuuse.smileupps.com',
            CHANNEL: 'vuuse',
            SERVERID: '0001'
          }
        },
        script: './lib/server'
      }

    };

};
