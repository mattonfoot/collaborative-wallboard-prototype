var fortune = require('fortune')
    connect = require('connect'),
    socketio = require('socket.io'),
    http = require('http');


var port = process.env.PORT || 5000,
    config = { db: 'vuu.se' },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

app.hypermedia = {
    wall: require('./lib/vuu.se.hypermedia.wall.js').init( app, io ),
    board: require('./lib/vuu.se.hypermedia.board.js').init( app, io ),
    region: require('./lib/vuu.se.hypermedia.region.js').init( app, io ),
    pocket:  require('./lib/vuu.se.hypermedia.pocket.js').init( app, io ),
    card: require('./lib/vuu.se.hypermedia.card.js').init( app, io )
};

app.use( connect.static( __dirname + '/designs' ) );

io.sockets
    .on( 'connection', function( socket ) {
        app.hypermedia.wall.search( {} ).then(function( resources ) { socket.emit( 'app:init', resources ); });
    });

httpServer.listen( port );
