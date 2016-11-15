var hrtime = require('performance-now');

const setOptions = ( queue, options ) => {
  options = queue.options = options || {};
  if (!options.channelName) {
    throw new Error( 'A channel name must be provided' );
  }
  queue.channel = options.channelName;

  if (!options.db) {
    throw new Error( 'A database must be provided' );
  }
  queue.db = options.db;

  if ( options.clientId ) {
    queue.clientId = options.clientId + queue.loadTime;
  }
};

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

const getEventStore = ( postal, channel, db, clientId ) => {
  var PouchEventStore = require('../queue/pouch.eventstore')( postal );

  return new PouchEventStore( channel, db, clientId );
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

function NoQueueData() {}

function EventQueue( o ) {
  this.loadTime = Date.now();

  setOptions( this, o );

  this.bus = require('postal');
  if ( this.options.federate && this.clientId ) {
    var io = require( 'socket.io-client' );

    this.bus = getFederatedBus( this.bus, io, this.clientId, this.channel );
    this.socket = io.connect( window.location.origin );
    this.bus.fedx.signalReady();
  }

  this.eventStore = getEventStore( this.bus, this.channel, this.db, this.clientId );

  if ( this.options.debug ) {
    this.wireTap = getDiagnosticsWireTap( this.bus, this.channel );
  }
}

EventQueue.prototype.syncWithRemote = function( remoteDB ) {
  var db = this.db;

  return db.sync( remoteDB );
};

EventQueue.prototype.syncEventStreams = function( /* userid */ ) {
  var queue = this;

  return new Promise(function(resolve /*, reject */ ) {
    if ( !queue.options.federate || !queue.clientId ) {
      resolve();
    }

    var lastSync;
    if (typeof localStorage !== 'undefined') {
      lastSync = localStorage.getItem( 'vuuse.lastSync');
    }

    var opts = {
      clientId: queue.clientId,
      lastSync: lastSync
    };

    const storeEvent = ( event ) => {
      queue.db.get( event.doc._id, function( err, doc ) {
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

    const syncWithRemote = ( /* event */ ) => {
      // emit events to server
      var lastSync = (opts.lastSync || '').split('/');
      var lastTimeStamp = new Date( lastSync[ 0 ] || 0 );
      var lastTicks = ( lastSync[ 1 ] || 0 ) * 1;

      queue.db.allDocs({ include_docs: true })
        .then(( events ) => {
          if ( events.rows.length ) {
            events.rows.forEach(function( event ) {
              var timeStamp = new Date( event.doc.timeStamp );
              var ticks = event.doc.data.ticks * 1;

              if ( timeStamp > lastTimeStamp && ticks > lastTicks ) {
                queue.socket.emit( 'remote.event', event );
              }
            });
          }
        })
        .catch(( err ) => {
          console.log( 'SYNC WITH REMOTE ERROR', err.message );
          console.log( err.stack );
          console.log( doc );
        });

      resolve();
    };

    queue.socket.on('remote.event', storeEvent );
    queue.socket.on('remote.ready', syncWithRemote );
    queue.socket.on('disconnect', () => console.log( 'REMOTE SERVER DISCONNECTED' ) );

    queue.socket.emit('remote.ready', opts);
  });
};

EventQueue.prototype.publish = function( topic, data ) {
  var hrt = hrtime();

  var msg = {
    ticks: this.loadTime + (hrt * 1000)
  };

  for ( var prop in data ) {
    if ( data.hasOwnProperty( prop ) ) {
      msg[ prop ] = data[ prop ];
    }
  }

  if ( this.clientId ) {
    msg.user = this.clientId;
  }

  return this.bus.publish({
    channel: this.channel,
    topic: topic,
    data: msg || new NoQueueData()
  });
};

EventQueue.prototype.subscribe = function( topic, reaction ) {
  return this.bus.subscribe({
    channel: this.channel,
    topic: topic,
    callback: reaction
  });
};

EventQueue.prototype.unsubscribe = function( subscription ) {
  return this.bus.unsubscribe( subscription );
};

EventQueue.prototype.clearAll = function() {
  return this.bus.unsubscribeFor({
    channel: this.channel
  });
};

module.exports = EventQueue;
