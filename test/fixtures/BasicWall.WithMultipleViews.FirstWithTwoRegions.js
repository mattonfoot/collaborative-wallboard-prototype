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
  var viewid_1 = uuid.v4();
  var viewid_2 = uuid.v4();
  var regionid_1 = uuid.v4();
  var regionid_2 = uuid.v4();
  var cardid_1 = uuid.v4();
  var cardid_2 = uuid.v4();

  var now = new Date().getTime();
  var ticks = hrtime();
  ticks = ticks[0] * 1e9 + ticks[1];

  db.docs = [
    {
      _id: ctx.channelName +'_card_'+ cardid_2 +'_'+ new Date().getTime() +'_moved',
      data: {
        card: cardid_2,
        view: viewid_1,
        x: 250, // 250 - 350
        y: 250  // 250 - 315
      },
      channel: ctx.channelName,
      topic: 'card.moved',
      ticks: ticks + 15,
      timeStamp: new Date( now + 15 )
    },
    {
      _id: ctx.channelName +'_card_'+ cardid_2 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        card: cardid_2
      },
      channel: ctx.channelName,
      topic: 'card.added',
      ticks: ticks + 14,
      timeStamp: new Date( now + 14 )
    },
    {
      _id: ctx.channelName +'_card_'+ cardid_2 +'_'+ new Date().getTime() +'_created',
      data: {
        card: cardid_2,
        wall: wallid,
        title: 'Second Card'
      },
      channel: ctx.channelName,
      topic: 'card.created',
      ticks: ticks + 13,
      timeStamp: new Date( now + 13 )
    },
    {
      _id: ctx.channelName +'_card_'+ cardid_1 +'_'+ new Date().getTime() +'_moved',
      data: {
        card: cardid_1,
        view: viewid_1,
        x: 250,  // 250 - 350
        y: 0     // 0 - 65
      },
      channel: ctx.channelName,
      topic: 'card.moved',
      ticks: ticks + 12,
      timeStamp: new Date( now + 12 )
    },
    {
      _id: ctx.channelName +'_card_'+ cardid_1 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        card: cardid_1
      },
      channel: ctx.channelName,
      topic: 'card.added',
      ticks: ticks + 11,
      timeStamp: new Date( now + 11 )
    },
    {
      _id: ctx.channelName +'_card_'+ cardid_1 +'_'+ new Date().getTime() +'_created',
      data: {
        card: cardid_1,
        wall: wallid,
        title: 'First Card'
      },
      channel: ctx.channelName,
      topic: 'card.created',
      ticks: ticks + 10,
      timeStamp: new Date( now + 10 )
    },
    {
      _id: ctx.channelName +'_region_'+ regionid_2 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        view: viewid_1,
        region: regionid_2
      },
      channel: ctx.channelName,
      topic: 'region.added',
      ticks: ticks + 9,
      timeStamp: new Date( now + 9 )
    },
    {
      _id: ctx.channelName +'_region_'+ regionid_2 +'_'+ new Date().getTime() +'_created',
      data: {
        region: regionid_2,
        view: viewid_1,
        label: 'Blue Region',
        width: 200,
        height: 200,
        x: 400, // 400 - 600
        y: 400, // 400 - 600
        value: 'two',
        color: 'blue'
      },
      channel: ctx.channelName,
      topic: 'region.created',
      ticks: ticks + 8,
      timeStamp: new Date( now + 8 )
    },
    {
      _id: ctx.channelName +'_region_'+ regionid_1 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        view: viewid_1,
        region: regionid_1
      },
      channel: ctx.channelName,
      topic: 'region.added',
      ticks: ticks + 7,
      timeStamp: new Date( now + 7 )
    },
    {
      _id: ctx.channelName +'_region_'+ regionid_1 +'_'+ new Date().getTime() +'_created',
      data: {
        region: regionid_1,
        view: viewid_1,
        label: 'Red Region',
        width: 200,
        height: 200,
        x: 0, // 0 - 200
        y: 0, // 0 - 200
        value: 'one',
        color: 'red'
      },
      channel: ctx.channelName,
      topic: 'region.created',
      ticks: ticks + 6,
      timeStamp: new Date( now + 6 )
    },
    {
      _id: ctx.channelName +'_view_'+ viewid_2 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        view: viewid_2
      },
      channel: ctx.channelName,
      topic: 'view.added',
      ticks: ticks + 5,
      timeStamp: new Date( now + 5 )
    },
    {
      _id: ctx.channelName +'_view_'+ viewid_2 +'_'+ new Date().getTime() +'_created',
      data: {
        view: viewid_2,
        wall: wallid,
        name: 'empty view'
      },
      channel: ctx.channelName,
      topic: 'view.created',
      ticks: ticks + 4,
      timeStamp: new Date( now + 4 )
    },
    {
      _id: ctx.channelName +'_view_'+ viewid_1 +'_'+ new Date().getTime() +'_added',
      data: {
        wall: wallid,
        view: viewid_1
      },
      channel: ctx.channelName,
      topic: 'view.added',
      ticks: ticks + 3,
      timeStamp: new Date( now + 3 )
    },
    {
      _id: ctx.channelName +'_view_'+ viewid_1 +'_'+ new Date().getTime() +'_created',
      data: {
        view: viewid_1,
        wall: wallid,
        name: 'view for cards and regions'
      },
      channel: ctx.channelName,
      topic: 'view.created',
      ticks: ticks + 2,
      timeStamp: new Date( now + 2 )
    },
    {
      _id: ctx.channelName +'_wall_'+ wallid +'_'+ new Date().getTime() +'_created',
      data: {
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

        return repository.getView( viewid_1 );
      })
      .then(function( view ) {
        storage.view = view;
        storage.views.push( view );

        return repository.getView( viewid_2 );
      })
      .then(function( view ) {
        storage.views.push( view );

        return repository.getRegion( regionid_1 );
      })
      .then(function( region ) {
        storage.region = region;
        storage.regions.push( region );

        return repository.getRegion( regionid_2 );
      })
      .then(function( region ) {
        storage.regions.push( region );

        return repository.getCard( cardid_1 );
      })
      .then(function( card ) {
        storage.card = card;
        storage.cards.push( card );

        return repository.getCard( cardid_2 );
      })
      .then(function( card ) {
        storage.cards.push( card );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
