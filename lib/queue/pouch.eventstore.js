
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

module.exports = PouchEventStore;
