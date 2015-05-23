var express    = require( 'express' ),
    PouchDB = require('pouchdb'),
  	app        = express(),
  	server     = require( 'http' ).createServer( app ),
  	io         = require( 'socket.io' )( server ),
  	postalCore = require( 'postal' ),
  	postalFedx = require( 'postal.federation' )( postalCore ),
  	postal     = require( '../queue/postal.socketio' )( postalFedx, io );

var DiagnosticsWireTap = require('postal.diagnostics')( postal );
var PouchEventStore = require('../queue/pouch.eventstore')( postal );

var port = process.env.PORT || 9001;
var host = process.env.HOST || '0.0.0.0';
var channelName = 'vuu.se';
var db = new PouchDB( 'vuuse', { db: require('memdown') } );
var server_id = "vuu.se-server-" + (new Date()).getTime();

postal.instanceId( server_id );

app.use( express.static('dist') );
app.use( express.static('test') );
app.use( express.static('browser') );
app.use( express.static('node_modules') );

server.listen( port, host, onListen );

var eventStore = new PouchEventStore( channelName, db );

var wireTap = new DiagnosticsWireTap({
  name: "console",
  filters: [
    { channel: channelName }
  ]
});

postal.fedx.addFilter([
	{ channel: channelName, topic: '#', direction: 'both' }
]);

io.on( 'connection', onConnect );

function onListen() {
  console.log( 'VUU.SE server listening on '+ host +':'+ port );
}

function onConnect( socket ) {
  console.log( "CLIENT CONNECTED" );

  socket.on( 'disconnect', onDisconnect );
}

function onDisconnect() {
  console.log( "CLIENT DISCONNECTED" );
}
