var express = require( 'express' ),
  	app     = express(),
  	server  = require( 'http' ).createServer( app ),
  	io      = require( 'socket.io' ).listen( server );

var port = process.env.PORT || 9001;
var host = process.env.HOST || '0.0.0.0';
var server_id = "vuu.se-server-" + (new Date()).getTime();

app.use(express.static('dist'));
app.use(express.static('test'));
app.use(express.static('browser'));
app.use(express.static('node_modules'));

io.serveClient( false );
io.on( 'connection', onConnect );

server.listen( port, host, onListen );

function onListen() {
  console.log( 'VUU.SE server listening on '+ host +':'+ port );
}

function onConnect( socket ) {
  console.log( "CLIENT CONNECTED" );

  socket.on( 'vuuse.fromClient', function( message ) {
    broadcastMessage( socket, message );
  });

  socket.on( 'disconnect', onDisconnect );
}

function onDisconnect() {
  console.log( "CLIENT DISCONNECTED" );
}

function broadcastMessage( socket, message ) {
  socket.broadcast.emit( 'vuuse.fromServer', message );
}
