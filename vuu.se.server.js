var fortune = require('fortune')
  , connect = require('connect')
  , socketio = require('socket.io')
  , http = require('http')
  , EventQueue = require('./lib/vuu.se.eventqueue.js');

var port = process.env.PORT || 5000,
    host = process.env.HOST || '0.0.0.0'
    config = {
        db: 'vuu.se'
      , baseUrl: 'http://0.0.0.0'
      , production: true
    },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

app.queue = new EventQueue( io );

app.hypermedia = {
    wall: require('./lib/vuu.se.hypermedia.wall.js').init( app ),
    board: require('./lib/vuu.se.hypermedia.board.js').init( app ),
    region: require('./lib/vuu.se.hypermedia.region.js').init( app ),
    pocket:  require('./lib/vuu.se.hypermedia.pocket.js').init( app ),
    card: require('./lib/vuu.se.hypermedia.card.js').init( app )
};

require('./lib/vuu.se.trackMovement.js').init( app );

app.use( connect.static( __dirname + '/designs' ) );

app.queue.on( 'connection', function( socket ) {
    app.hypermedia.wall
        .search({})
        .then(function( resources ) {
            socket.emit( 'app:init', resources );
        });
});

httpServer.listen( port, host );
