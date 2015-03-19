module.exports = function( config ) {

    return {

        dev: {

            options: {
                port: 9001,
                useAvailablePort: true,
                keepalive: true,
                base: [ './dist' ],
                open: 'http://remotehost:9001'
            }

        }

    };

};
