var hrtime = require('performance-now');

module.exports = function( postal ) {

  var PouchEventStore = function( channelName, db ) {
    this.db = db;
    this.channel = channelName;

    this.loadTime = Date.now();

    if ( this.db ) postal.addWireTap( wiretapFn.bind( this ) );
  };

  function wiretapFn( data, envelope, nesting ) {
    if ( envelope.channel === this.channel ) {
      var hrt = hrtime();
      var ticks = this.loadTime + (hrt * 1000);

      var id = [
        envelope.channel,
        envelope.topic.split('.')[0],
        data[ envelope.topic.split('.')[0] ],
        ticks,
        envelope.topic.split('.')[1]
      ].join( '_' );

      var doc = {
        _id: id,
        data: data,
        channel: envelope.channel,
        topic: envelope.topic,
        ticks: ticks,
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
