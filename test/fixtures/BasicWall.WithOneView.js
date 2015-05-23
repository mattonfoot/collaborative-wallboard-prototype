var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var uuid = require('uuid');
var hrtime = require('browser-process-hrtime');


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

  var wallid = uuid.v4();
  var viewid = uuid.v4();

  var now = new Date().getTime();
  var ticks = hrtime();
  ticks = ticks[0] * 1e9 + ticks[1];

  // most recent first
  db.docs = [
    {
      _id: ctx.channelName +'_view_'+ viewid +'_'+ new Date().getTime() +'_created',
      data: {
        wall: wallid,
        view: viewid
      },
      channel: ctx.channelName,
      topic: 'view.added',
      ticks: ticks + 3,
      timeStamp: new Date( now + 3 )
    },
    {
      _id: ctx.channelName +'_view_'+ viewid +'_'+ new Date().getTime() +'_created',
      data:
      {
        view: viewid,
        wall: wallid,
        name: storedName
      },
      channel: ctx.channelName,
      topic: 'view.created',
      ticks: ticks + 2,
      timeStamp: new Date( now + 2 )
    },
    {
      _id: ctx.channelName +'_wall_'+ wallid +'_'+ new Date().getTime() +'_created',
      data:
      {
        wall: wallid,
        name: 'wall for view'
      },
      channel: ctx.channelName,
      topic: 'wall.created',
      ticks: ticks + 1,
      timeStamp: new Date( now + 1 )
    }
  ];

  return new Promise(function( resolve, reject ) {
    repository.getWall( wallid )
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return repository.getView( viewid );
      })
      .then(function( view ) {
        storage.view = view;
        storage.views.push( view );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
