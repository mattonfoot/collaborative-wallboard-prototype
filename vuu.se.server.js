var fortune = require('fortune')
  , connect = require('connect')
  , socketio = require('socket.io')
  , http = require('http')
  , EventQueue = require('./lib/vuu.se.eventqueue')
  , express = require('express')
  , passport = require('passport')
  , strategy = require('./lib/vuu.se.passport.setup')
  , Mustache = require('mustache')
  , fs = require('fs');

var port = process.env.PORT || 80,
    host = process.env.HOST || '0.0.0.0'
    config = {
        db: 'vuu.se'
      , baseUrl: 'http://0.0.0.0'
      , production: true
    },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

app.use( express.cookieParser() );
app.use( express.session({ secret: 'shhhhhhhhh' }) );

app.use( passport.initialize() );
app.use( passport.session() );

app.use( connect.static( __dirname + '/designs' ) );

app.queue = new EventQueue( io );

app.hypermedia = {
    wall: require('./lib/vuu.se.hypermedia.wall.js').init( app ),
    board: require('./lib/vuu.se.hypermedia.board.js').init( app ),
    region: require('./lib/vuu.se.hypermedia.region.js').init( app ),
    pocket:  require('./lib/vuu.se.hypermedia.pocket.js').init( app ),
    card: require('./lib/vuu.se.hypermedia.card.js').init( app ),
    user: require('./lib/vuu.se.hypermedia.user.js').init( app )
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

            var body = Mustache.render( data.toString(), { user : req.user, raw: JSON.stringify( req.user, 0, 2) } );

            res.send( 200, body );
        });
    });

require('./lib/vuu.se.trackMovement.js').init( app );

app.queue.on( 'connection', function( socket ) {
    app.hypermedia.wall
        .search({})
        .then(function( resources ) {
            socket.emit( 'app:init', resources );
        });
});

httpServer.listen( port, host );

console.log('Server listening on ' + host + ':' + port);
