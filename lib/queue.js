var postal = require('postal');
var postalWhen = require('postal.when')( postal );
var DiagnosticsWireTap = require('postal.diagnostics')( postal );

function NoQueueData() { }

function EventQueue( options ) {
  this.options = options || {};
  this.options.channel = this.options.channel || 'vuu.se';
  this.db = this.options.db;

  this.channel = postal.channel( this.options.channel );

  if ( this.options.debug ) {
    this.wireTap = new DiagnosticsWireTap({
      name: "console",
      filters: [
        { channel: this.options.channel }
      ]
    });
  }

  this.eventStore = new PouchEventStore( this.channel, this.options );

  this.nodata = NoQueueData;
}

EventQueue.prototype.publish = function( topic, data ) {
  return this.channel.publish( topic, data || new NoQueueData() );
};

EventQueue.prototype.subscribe = function( topic, reaction ) {
  return this.channel.subscribe( topic, reaction );
};

EventQueue.prototype.unsubscribe = function( subscription ) {
  return postal.unsubscribe( subscription );
};

EventQueue.prototype.clearAll = function() {
  return postal.unsubscribeFor({ channel: this.options.channel });
};

EventQueue.prototype.when = function( channelDefs, onSuccess, onError, options ) {
  var options = this.options;

  channelDefs = channelDefs.map(function( topic ) {
    if ( typeof topic === 'string' ) {
      return { channel: options.channel, topic: topic };
    }

    return ev;
  });

  return postal.when( channelDefs, onSuccess, onError, options );
};

var PouchEventStore = function( postal, options ) {
  this.postal = postal;
  this.db = options.db;
  this.channel = options.channel;

  if ( this.db ) postal.bus.addWireTap( wiretapFn.bind( this ) );
};

function wiretapFn( data, envelope, nesting ) {
  if ( envelope.channel === this.channel ) {
    var id = [
      envelope.channel,
      envelope.topic.split('.')[0],
      data[ envelope.topic.split('.')[0] ],
      envelope.timeStamp.getTime()
    ].join( '_' );

    var doc = {
      _id: id,
      data: data,
      channel: envelope.channel,
      topic: envelope.topic,
      timeStamp: envelope.timeStamp
    };

    this.db.put( doc )
      .catch(function ( err ) {
        console.log( err );
      });
  }
};

module.exports = EventQueue;
