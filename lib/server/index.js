var express    = require( 'express' );
var app        = express();
var server     = require( 'http' ).createServer( app );
var io         = require( 'socket.io' )( server, { 'transports': [ 'polling' ] });
var postalCore = require( 'postal' );

var debug = false;

const getFederatedBus = ( postal, io, clientId, channel ) => {
  var postalFedx = require( 'postal.federation' )( postal );
  postal = require( '../queue/postal.socketio' )( postalFedx, io );

  postal.instanceId( clientId );

  postal.fedx.addFilter([
    {
      channel: channel,
      topic: '#',
      direction: 'both',
    },
  ]);

  return postal;
};

const getEventStore = ( postal, channelName, database, instanceId ) => {
  var PouchEventStore = require('../queue/pouch.eventstore')( postal );

  return new PouchEventStore( channelName, database, instanceId, true );
};

const getDiagnosticsWireTap = (postal, channel) => {
  var DiagnosticsWireTap = require('postal.diagnostics')( postal );

  return new DiagnosticsWireTap({
    name: 'console',
    filters: [
      { channel: channel },
    ]
  });
};

const onConnect = ( socket ) => {
  console.log( 'CLIENT CONNECTED' );

  const storeEvent = ( event ) => {
    database.get( event.doc._id, function( err, doc ) {
      if ( doc ) {
        var docrev = ( (doc && doc._rev) || '0' ).split('-')[ 0 ] * 1;
        var edocrev = ((event.doc && event.doc._rev) || '0' ).split('-')[ 0 ] * 1 ;

        if ( docrev >= edocrev ) {
          return;
        }

        event.doc._rev = doc._rev;
      }

      return queue.db.put( event.doc )
        .catch(( err ) => {
          console.log( 'STORE EVENT ERROR', err.message );
          console.log( err );
          console.log( doc );
          console.log( event.doc );
        })
        .then(( /* info */ ) => {
          if (typeof localStorage !== 'undefined') {
            localStorage.getItem( 'vuuse.lastSync', event.doc.timeStamp + '/' + event.doc.ticks );
          }
        });
    });
  };

  const syncWithRemote = ( opts ) => {
    // emit events to client
    var lastSync = (opts.lastSync || '').split('/');
    var lastTimeStamp = new Date( lastSync[ 0 ] || 0 );
    var lastTicks = ( lastSync[ 1 ] || 0 ) * 1;

    database.allDocs({ include_docs: true })
      .then(( events ) => {
        if ( events.rows.length ) {
          var syncEvents = events.rows.filter(( event ) => {
            var timeStamp = new Date( event.doc.timeStamp );
            var ticks = event.doc.data.ticks * 1;

            return timeStamp > lastTimeStamp && ticks > lastTicks;
          });

          if (syncEvents.length) {
            syncEvents.forEach((event) => socket.emit( 'remote.event', event ));
          } else {
            console.log('REMOTE NOT READY');
          }
        }
      })
      .catch(( err ) => {
        console.log( 'REMOTE READY ERROR', err.message );
        console.log( err.stack );
        console.log( doc );
      });

    // resolve();
  };

  socket.on( 'remote.event', storeEvent );
  socket.on( 'remote.ready', syncWithRemote );
  socket.on( 'disconnect', () => console.log( 'REMOTE CLIENT DISCONNECTED' ) );
};

// configure

var port = process.env.PORT || 9001;
var host = process.env.HOST || '0.0.0.0';
var couchdb = process.env.COUCH || 'http://localhost:5984';
var channelName = process.env.CHANNEL || 'vuuse';
var serverIdentifier = process.env.SERVERID || '0001';
var dataURI = '/data';

// set up the event store

var instanceId = channelName + '-server-' + serverIdentifier + '_pouch_vuuse/';

var HTTPPouchDB = require('http-pouchdb')( require('pouchdb') );

var database = new HTTPPouchDB( couchdb + '/' + instanceId );
database._info(function( err, info ) {
  if (err) {
    console.error( 'Database Connection Error', {
      message: err.message,
      uri: couchdb + '/' + instanceId
    });
  }

  console.log( info );
});

var postal = getFederatedBus( postalCore, io, instanceId, channelName );
io.on( 'connection', onConnect );
getEventStore( postal, channelName, database, instanceId );
if ( debug ) {
  getDiagnosticsWireTap( postal, channelName );
}

// setup the server

app.use( express.static( 'dist') );
app.use( express.static( 'designs') );
app.use( express.static( 'test') );
app.use( express.static( 'browser') );
app.use( express.static( 'node_modules') );

app.get('/config', function( req, res ) {
  res.type('json');

  res.send({
    channelName: channelName,
    dataURI: dataURI
  });
});

server.listen( port, host, () => console.log( 'VUU.SE server listening on '+ host +':'+ port ) );
