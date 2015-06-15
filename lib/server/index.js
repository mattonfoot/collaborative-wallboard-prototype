var express    = require( 'express' ),
    PouchDB    = require('pouchdb'),
  	app        = express(),
  	server     = require( 'http' ).createServer( app ),
  	io         = require( 'socket.io' )( server, {
      "transports": [ "polling" ]
    }),
  	postalCore = require( 'postal' ),
  	postalFedx = require( 'postal.federation' )( postalCore ),
  	postal     = require( '../queue/postal.socketio' )( postalFedx, io );

var port = process.env.PORT || 9001;
var host = process.env.HOST || '0.0.0.0';
var couchdb = process.env.COUCH || 'http://localhost:5984';
var channelName = process.env.CHANNEL || 'vuuse';
var serverIdentifier = process.env.SERVERID || '0001';
var dataURI = '/data';

// serve static directories
app.use( express.static( 'dist') );
app.use( express.static( 'design') );

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

var HTTPPouchDB = require('http-pouchdb')( PouchDB, couchdb + '/' + instanceId );

var database = new HTTPPouchDB( 'vuuse' );

/*
database._info(function( err, info ) {
  if (err) return console.error( err );

  console.log( info );
});
*/

app.use(dataURI, require('express-pouchdb')( HTTPPouchDB, {
  configPath: __dirname + '/config.json',
  mode: 'minimumForPouchDB'
}));


var PouchEventStore = require('../queue/pouch.eventstore')( postal );
var eventStore = new PouchEventStore( channelName, database, instanceId, true );

var DiagnosticsWireTap = require('postal.diagnostics')( postal );
var wireTap = new DiagnosticsWireTap({
  name: "console"/*,
  filters: [
    { channel: channelName }
  ]*/
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

  socket.on( 'client.ready', onClientReady );
  socket.on( 'disconnect', onDisconnect );

  var clientChannel;

  function onClientReady( opts ) {
    clientChannel = opts.channel;

    if (opts.timeStamp) opts.timeStamp = new Date( opts.timeStamp );
    if (opts.ticks) opts.ticks = opts.ticks * 1;

    postal.fedx.addFilter([
    	{ channel: clientChannel, topic: '#', direction: 'both' }
    ]);

    console.log( "CLIENT READY", opts );

    // get events since timestamp
    database.allDocs({ include_docs: true }, onComplete );

    function onComplete( err, events ) {
      if ( err ) throw err;

      // replay events to client

      if ( events.rows.length ) {
        events.rows.forEach(function( event ) {
          var timeStamp = event.doc.timeStamp;
          var ticks = event.doc.data.ticks;

          if ( (!opts.timeStamp || timeStamp > opts.timeStamp)
              && (!opts.ticks || ticks > opts.ticks) ) {
            event.channel = clientChannel;

            socket.emit( 'client.event', event );
          }
        });
      }

      socket.emit( 'server.ready' );
      console.log( "SERVER READY" );
    }
  }

  function onDisconnect() {
    console.log( "CLIENT DISCONNECTED" );

    postal.fedx.removeFilter([
      { channel: clientChannel, topic: '#', direction: 'both' }
    ]);
  }
}
