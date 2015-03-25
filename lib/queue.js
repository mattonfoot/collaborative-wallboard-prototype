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
  var topic = ev.replace(':', '.'); // legacy name spaces

  return this.channel.publish( topic, data || new NoQueueData() );
};
EventQueue.prototype.emit = function( ev, data ) {
  return this.publish( ev, data );
};
EventQueue.prototype.trigger = function( ev, data ) {
  return this.publish( ev, data );
};

// subscribe

EventQueue.prototype.subscribe = function( ev, reaction ) {
  var topic = ev.replace(':', '.'); // legacy name spaces

  return this.channel.subscribe( topic, reaction );
};
EventQueue.prototype.on = function( ev, reaction ) {
  return this.subscribe( ev, reaction );
};

// unsubscribe

EventQueue.prototype.unsubscribe = function( subscription ) {
  return postal.unsubscribe( subscription );
};
EventQueue.prototype.off = function( subscription ) {
  return this.unsubscribe( subscription );
};

EventQueue.prototype.reset = function() {
  return postal.reset();
};
EventQueue.prototype.clearAll = function() {
  return this.reset();
};

EventQueue.prototype.when = function( channelDefs, onSuccess, onError, options ) {
  var options = this.options;

  channelDefs = channelDefs.map(function( ev ) {
    if ( typeof ev === 'string' ) {
      var topic = ev.replace(':', '.'); // legacy name spaces

      return { channel: options.channel, topic: topic };
    }

    return ev;
  });

  return postal.when( channelDefs, onSuccess, onError, options );
};

module.exports = EventQueue;
