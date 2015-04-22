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

// publish

EventQueue.prototype.publish = function( ev, data ) {
  var topic = ev.replace(/\:/g, '.'); // legacy name spaces

  return this.channel.publish( topic, data || new NoQueueData() );
};

// subscribe

EventQueue.prototype.subscribe = function( ev, reaction ) {
  var topic = ev.replace(/\:/g, '.'); // legacy name spaces

  return this.channel.subscribe( topic, reaction );
};

// unsubscribe

EventQueue.prototype.unsubscribe = function( subscription ) {
  return postal.unsubscribe( subscription );
};

EventQueue.prototype.clearAll = function() {
  return postal.unsubscribeFor({ channel: this.options.channel });
};

EventQueue.prototype.when = function( channelDefs, onSuccess, onError, options ) {
  var options = this.options;

  channelDefs = channelDefs.map(function( ev ) {
    if ( typeof ev === 'string' ) {
      var topic = ev.replace(/\:/g, '.'); // legacy name spaces

      return { channel: options.channel, topic: topic };
    }

    return ev;
  });

  return postal.when( channelDefs, onSuccess, onError, options );
};

module.exports = EventQueue;
