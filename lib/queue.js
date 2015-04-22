var postal = require('postal');
var postalWhen = require('postal.when')( postal );
var DiagnosticsWireTap = require('postal.diagnostics')( postal );

function NoQueueData() { }

function EventQueue( options ) {
  this.options = options || {};
  this.options.channel = this.options.channel || 'vuu.se';

  this.channel = postal.channel( this.options.channel );

  if ( this.options.debug ) {
    this.wireTap = new DiagnosticsWireTap({
      name: "console",
      filters: [
        { channel: this.options.channel }
      ]
    });
  }

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

module.exports = EventQueue;
