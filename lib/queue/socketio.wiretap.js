var io = require('socket.io-client');

module.exports = function( postal ) {

  function SocketIOWireTap( channel, clientId ) {
    this.channel = channel;
    this.instanceId = 'client-' + clientId + '-' + (new Date()).getTime();

    this.init();
  };

  SocketIOWireTap.prototype.init = function() {
    this.socket = io.connect();

    this.bin = [];

    this.socket.on( 'vuuse.fromServer', onMessage.bind( this ) );

    postal.addWireTap( wiretapFn.bind( this ) );
  };

  function wiretapFn( data, envelope, nesting ) {
    if ( envelope.channel !== this.channel ) return;

    var serial = this.instanceId + '|' + envelope.timeStamp;
    if ( ~this.bin.indexOf( serial ) ) return;
    this.bin.push( serial );

    var message = {
      originator : this.instanceId,
      envelope   : envelope
    };

    this.socket.emit( 'vuuse.fromClient', message );
  }

  function onMessage( message ) {
    if ( message.originator === this.instanceId ) return;

    var serial = message.originator + '|' + message.envelope.timeStamp;
    if ( ~this.bin.indexOf( serial ) ) return;
    this.bin.push( serial );

    postal.publish( message.envelope );
  }

  return SocketIOWireTap
};
