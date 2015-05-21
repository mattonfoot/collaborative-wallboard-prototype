var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var uuid = require('uuid');

function fixture( ctx, storedName ) {
  var interface = ctx.interface;
  var repository = ctx.application.repository;
  var db = ctx.db;

  var storage = ctx.storage = {
    walls: [],
    views: [],
    regions: [],
    cards: [],
    locations: []
  };

  var wallid_1 = uuid.v4();
  var wallid_2 = uuid.v4();
  var wallid_3 = uuid.v4();

  var now = new Date().getTime();
  var ticks = process.hrtime();
  ticks = ticks[0] * 1e9 + ticks[1];

  db.docs = [
    {
      _id: ctx.channelName +'_wall_'+ wallid_1 +'_'+ new Date().getTime(),
      data: {
        wall: wallid_1,
        name: 'first wall'
      },
      channel: ctx.channelName,
      topic: 'wall.created',
      ticks: ticks + 3,
      timeStamp: new Date( now + 3 )
    },
    {
      _id: ctx.channelName +'_wall_'+ wallid_2 +'_'+ new Date().getTime(),
      data: {
        wall: wallid_2,
        name: 'other wall'
      },
      channel: ctx.channelName,
      topic: 'wall.created',
      ticks: ticks + 2,
      timeStamp: new Date( now + 2 )
    },
    {
      _id: ctx.channelName +'_wall_'+ wallid_3 +'_'+ new Date().getTime(),
      data: {
        wall: wallid_3,
        name: 'another wall'
      },
      channel: ctx.channelName,
      topic: 'wall.created',
      ticks: ticks + 1,
      timeStamp: new Date( now + 1 )
    }
  ];

  return new Promise(function( resolve, reject ) {
    repository.getWall( wallid_1 )
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return repository.getWall( wallid_2 );
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        return repository.getWall( wallid_3 );
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
