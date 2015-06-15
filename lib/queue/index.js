var hrtime = require('performance-now');
var postal = require('postal');
var RSVP = require('rsvp');
var Promise = RSVP.Promise;

function NoQueueData() {}

function EventQueue( options ) {
  var queue = this;

  this.loadTime = Date.now();

  this.options = options || {};
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

  var PouchEventStore = require('../queue/pouch.eventstore')( postal );
  this.eventStore = new PouchEventStore( this.channel, this.db, this.clientId );

  if ( options.debug ) {
    var DiagnosticsWireTap = require('postal.diagnostics')( postal );

    this.wireTap = new DiagnosticsWireTap({
      name: "console"/*,
      filters: [
        { channel: this.channel }
      ]*/
    });
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

    var queue = this;
    this.socket.on('connect', function() {
      queue.sessionid = queue.socket.io.engine.id;
    });
  }
}

EventQueue.prototype.syncEventStreams = function( userid ) {
  var queue = this;

  return new Promise(function(resolve, reject) {
    if ( queue.options.federate && queue.clientId ) {
      return onReady();
    }

    resolve();

    function onReady() {
      if ( !queue.sessionid ) return setTimeout( onReady, 10 );

      var lastTimestamp = {};
      if (typeof localStorage !== 'undefined') {
        lastTimestamp.timeStamp = localStorage.getItem( 'queue.lastTimestamp');
        lastTimestamp.ticks = localStorage.getItem( 'queue.lastTicks');
      }

      queue.socket.emit('client.ready', {
        channel: queue.channel + '/client/' + queue.clientId,
        sessionid: queue.sessionid,
        clientId: queue.clientId,
        timeStamp: lastTimestamp.timeStamp,
        ticks: lastTimestamp.ticks
      });

      queue.socket.on('client.event', function( event ) {
        queue.db.put( event.doc, function( err, info ) {
            if ( err ) throw err;

            if ( typeof localStorage !== 'undefined' ) {
              localStorage.setItem( 'queue.lastTimestamp', event.doc.timeStamp );
              localStorage.setItem( 'queue.lastTicks', event.doc.ticks );
            }
        });
      });

      queue.socket.on('server.ready', function() {
        resolve();
      });
    }
  });
};

EventQueue.prototype.signalReady = function() {
  postal.fedx.signalReady();
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

  var publisher =  postal.publish({
    channel: this.channel,
    topic: topic,
    data: msg || new NoQueueData()
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem( 'queue.lastTimestamp', msg.timeStamp );
    localStorage.setItem( 'queue.lastTicks', msg.ticks );
  }

  return publisher;
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
