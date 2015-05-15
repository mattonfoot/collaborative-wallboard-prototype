
module.exports = function( postal ) {

  var PouchEventStore = function( channel, db ) {
    this.db = db;
    this.channel = channel;

    if ( this.db ) postal.addWireTap( wiretapFn.bind( this ) );
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

  return PouchEventStore
};
