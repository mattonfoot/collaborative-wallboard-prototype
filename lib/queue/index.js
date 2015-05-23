var postal     = require('postal');

function NoQueueData() {}

function EventQueue( options ) {
  var queue = this;

  options = options || {};
  this.channel = options.channel || 'vuu.se';
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
  this.eventStore = new PouchEventStore( this.channel, this.db );

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

EventQueue.prototype.publish = function( topic, data ) {
  var msg = {};

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
