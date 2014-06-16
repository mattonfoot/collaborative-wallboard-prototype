var fortune = require('fortune')
  , connect = require('connect')
  , socketio = require('socket.io')
  , http = require('http')
  , EventQueue = require('./lib/vuu.se.eventqueue')
  , express = require('express')
  , cookieParser = require('cookie-parser')
  , session      = require('express-session')
  , serveStatic = require('serve-static')
  , passport = require('passport')
  , Auth0Strategy = require('passport-auth0')
  , Mustache = require('mustache')
  , fs = require('fs');

var port = Number(process.env.PORT || 80),
    host = process.env.HOST || '0.0.0.0',
    config = {
        db: 'vuu.se'
      , baseUrl: process.env.BASE_URL || 'http://vuuse-mattonfoot.herokuapp.com'
      , production: process.env.NODE_ENV === 'production'
    },
    auth0config = {
        domain:       'vuu-se.auth0.com',
        clientID:     'X0n9ZaXJrJgeP9V4KAI7LXsiMsn6jN4G',
        clientSecret: 'KaqyAODoqYM768jZJq8jnRCoQ2wYkwvpiJSgLV-5EUQlUexjpGi2HIFALivpbw2W',
        callbackURL:  config.baseUrl + '/callback',
        scriptUrl:    'https://cdn.auth0.com/w2/auth0-widget-3.1.min.js'
    },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

app.use( cookieParser() );
app.use( session({ secret: 'shhhhhhhhh' }) );

var strategy = require('./lib/vuu.se.passport.setup').init( passport, Auth0Strategy, auth0config );
app.use( passport.initialize() );
app.use( passport.session() );

app.use( serveStatic( __dirname + '/designs' ) );

app.queue = new EventQueue( io );

app.hypermedia = {
    wall: require('./lib/vuu.se.hypermedia.wall.js').init( app ),
    board: require('./lib/vuu.se.hypermedia.board.js').init( app ),
    region: require('./lib/vuu.se.hypermedia.region.js').init( app ),
    pocket:  require('./lib/vuu.se.hypermedia.pocket.js').init( app ),
    card: require('./lib/vuu.se.hypermedia.card.js').init( app ),
    transform: require('./lib/vuu.se.hypermedia.transform.js').init( app ),
    user: require('./lib/vuu.se.hypermedia.user.js').init( app, auth0config )
};

app.router.get('/',
    function(req, res, next) {
        if (!req.user) {
            res.redirect('/login');
        }

        fs.readFile( __dirname + '/lib/templates/app/ui.mustache', function (error, data) {
            if ( error ) {
                return next( new Error( error ? error.toString() : 'Failed to read app template from disk' ) );
            }

            var body = Mustache.render( data.toString(), { user : req.user, raw: JSON.stringify( req.user, 0, 2), auth0: auth0config } );

            res.send( 200, body );
        });
    });

require('./lib/vuu.se.trackMovement.js').init( app );
require('./lib/vuu.se.transformManager.js').init( app );

app.queue.on( 'connection', function( socket ) {
    app.hypermedia.wall
        .search({})
        .then(function( resources ) {
            socket.emit( 'app:init', resources );
        });
});

httpServer.listen( port, host );

console.log('Server listening on ' + host + ':' + port + ', ENV=' + config.production + ', ROOT=' + config.baseUrl);
