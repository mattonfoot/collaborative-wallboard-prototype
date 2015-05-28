var uuid = require('uuid');

module.exports = function( postal ) {

  var PouchEventStore = function( channelName, db, userid, isServer ) {
    this.db = db;
    this.channel = channelName;
    this.user = userid;
    this.isServer = isServer;

    if ( this.db ) postal.addWireTap( wiretapFn.bind( this ) );
  };

  function wiretapFn( data, envelope, nesting ) {
    if ( envelope.channel === this.channel ) {
      var id = [
        envelope.channel,
        envelope.topic.split('.')[0],
        data[ envelope.topic.split('.')[0] ],
        data.ticks,
        envelope.topic.split('.')[1]
      ].join( '_' );

      var doc = {
        _id: id,
        data: data,
        channel: envelope.channel,
        topic: envelope.topic,
        ticks: data.ticks,
        timeStamp: envelope.timeStamp,
        _rev: ( this.isServer ? 3 : ( data.user === this.user ? 1 : 2 ) ) + '-' + uuid.v4()
      };

      this.db.put( doc )
        .catch(function ( err ) {
          console.log( err );
        });
    }
  };

  return PouchEventStore
};
