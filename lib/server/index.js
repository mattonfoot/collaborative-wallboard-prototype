var express    = require( 'express' ),
    PouchDB    = require('pouchdb'),
  	app        = express(),
  	server     = require( 'http' ).createServer( app ),
  	io         = require( 'socket.io' )( server ),
  	postalCore = require( 'postal' ),
  	postalFedx = require( 'postal.federation' )( postalCore ),
  	postal     = require( '../queue/postal.socketio' )( postalFedx, io );

var port = process.env.PORT || 9001;
var host = process.env.HOST || '0.0.0.0';
var couchdb = process.env.COUCH || 'https://vuuse.smileupps.com';
var channelName = process.env.CHANNEL || 'vuuse';
var serverIdentifier = process.env.SERVERID || '0001';
var dataURI = '/data';

// serve static directories
app.use( express.static( __dirname + '../dist') );
app.use( express.static( __dirname + '../browser') );
app.use( express.static( __dirname + '../designs') );
app.use( express.static( __dirname + '../node_modules') );

// handle app config requests
app.get('/config', function( req, res ) {
  res.type('json');

  res.send({
    channelName: channelName,
    dataURI: dataURI
  });
});

// set up the event store

var instanceId = channelName + "-server-" + serverIdentifier;
postal.instanceId( instanceId );

PouchDB = PouchDB.defaults({ prefix: __dirname + '/db/data/' });

app.use(dataURI, require('express-pouchdb')( PouchDB, {
  configPath: __dirname + '/config.json',
  mode: 'minimumForPouchDB'
}));

var database = new PouchDB( channelName );

var PouchEventStore = require('../queue/pouch.eventstore')( postal );
var eventStore = new PouchEventStore( channelName, database, instanceId, true );

var DiagnosticsWireTap = require('postal.diagnostics')( postal );
var wireTap = new DiagnosticsWireTap({
  name: "console",
  filters: [
    { channel: channelName }
  ]
});

postal.fedx.addFilter([
	{ channel: channelName, topic: '#', direction: 'both' }
]);

// await connections
io.on( 'connection', onConnect );

// start the server
server.listen( port, host, onListen );

// private functions

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
