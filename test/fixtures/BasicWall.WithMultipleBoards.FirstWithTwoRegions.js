var RSVP = require('rsvp');
var Promise = RSVP.Promise;

function fixture( ctx, storedName ) {
  var interface = ctx.interface;

  var storage = ctx.storage = {
    walls: [],
    views: [],
    regions: [],
    cards: [],
    locations: []
  };

  return new Promise(function( resolve, reject ) {
    interface
      .createWall({ name: 'wall for view' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return interface.createView({ wall: storage.wall.getId(), name: 'view for cards and regions' });
      })
      .then(function( view ) {
        storage.view = view;
        storage.views.push( view );

        return interface.createView({ wall: storage.wall.getId(), name: 'empty view' });
      })
      .then(function( view ) {
        storage.views.push( view );

        return interface.createRegion({
          view: storage.view.getId(),
          label: 'Red Region',
          color: 'red',
          value: 'one',
          width: 200,
          height: 200,
          x: 200,
          y: 200
        });
      })
      .then(function( region ) {
        storage.region = region;
        storage.regions.push( region );

        return interface.createRegion({
          view: storage.view.getId(),
          label: 'Blue Region',
          color: 'blue',
          value: 'two',
          width: 200,
          height: 200,
          x: 500,
          y: 500
        });
      })
      .then(function( region ) {
        storage.regions.push( region );

        return interface.createCard({
          wall: storage.wall.getId(),
          title: 'First Card'
        });
      })
      .then(function( card ) {
        storage.card = card;
        storage.cards.push( card );

        return interface.createCard({
          wall: storage.wall.getId(),
          title: 'Second Card'
        });
      })
      .then(function( card ) {
        storage.cards.push( card );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
