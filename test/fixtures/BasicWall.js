var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var uuid = require('uuid');

function fixture( ctx, storedName ) {
  var interface = ctx.interface;
  var repository = ctx.application.repository;
  var db = ctx.db;

  var storage = ctx.storage = {
    walls: [],
    boards: [],
    regions: [],
    cards: [],
    locations: []
  };

  var wallid = uuid.v4();

  var ticks = process.hrtime();
  ticks = ticks[0] * 1e9 + ticks[1];

  db.docs = [
    {
      _id: ctx.channelName +'_wall_'+ wallid +'_'+ new Date().getTime(),
      data:
      {
        wall: wallid,
        name: storedName
      },
      channel: ctx.channelName,
      topic: 'wall.created',
      ticks: ticks,
      timeStamp: new Date()
    }
  ];

  return new Promise(function( resolve, reject ) {
    repository.getWall( wallid )
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
