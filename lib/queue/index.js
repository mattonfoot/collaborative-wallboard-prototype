var hrtime = require('performance-now');
var postal = require('postal');

function NoQueueData() {}

function EventQueue( options ) {
  var queue = this;

  this.loadTime = Date.now();

  options = options || {};
  if (!options.channelName) {
    throw new Error( 'A channel name must be provided' );
  }
  this.channel = options.channelName;

  if (!options.db) {
    throw new Error( 'A database must be provided' );
  }
  this.db = options.db;

  if ( options.clientId ) {
    this.clientId = options.clientId;
  }

  if ( options.federate && this.clientId ) {
    var io = require( 'socket.io-client' );
    var postalCore = require( 'postal' );
    var postalFedx = require( 'postal.federation' )( postalCore );

    postal = require( '../queue/postal.socketio' )( postalFedx, io );

    postal.instanceId( this.clientId );

    this.socket = io.connect( window.location.origin );

    postal.fedx.addFilter([
    	{ channel: this.channel, topic: '#', direction: 'both' }
    ]);

	  postal.fedx.signalReady();
  }

  var PouchEventStore = require('../queue/pouch.eventstore')( postal );
  this.eventStore = new PouchEventStore( this.channel, this.db, this.clientId );

  if ( options.debug ) {
    var DiagnosticsWireTap = require('postal.diagnostics')( postal );

    this.wireTap = new DiagnosticsWireTap({
      name: "console",
      filters: [
        { channel: this.channel }
      ]
    });
  }
}

EventQueue.prototype.syncWithRemote = function( remoteDB ) {
  var db = this.db;

  return db.sync( remoteDB);
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

  return postal.publish({
    channel: this.channel,
    topic: topic,
    data: msg || new NoQueueData()
  });
};

EventQueue.prototype.subscribe = function( topic, reaction ) {
  return postal.subscribe({
    channel: this.channel,
    topic: topic,
    callback: reaction
  });
};

EventQueue.prototype.unsubscribe = function( subscription ) {
  return postal.unsubscribe( subscription );
};

EventQueue.prototype.clearAll = function() {
  return postal.unsubscribeFor({
    channel: this.channel
  });
};

module.exports = EventQueue;
