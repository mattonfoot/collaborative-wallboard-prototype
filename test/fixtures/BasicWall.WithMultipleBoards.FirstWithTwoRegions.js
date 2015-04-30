var RSVP = require('rsvp');
var Promise = RSVP.Promise;

function fixture( ctx, storedName ) {
  var services = ctx.services;

  var storage = ctx.storage = {
    walls: [],
    views: [],
    regions: [],
    cards: [],
    locations: []
  };

  return new Promise(function( resolve, reject ) {
    services
      .createWall({ name: 'wall for view' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return services.createView({ wall: storage.wall.getId(), name: 'view for cards and regions' });
      })
      .then(function( view ) {
        storage.view = view;
        storage.views.push( view );

        return services.createView({ wall: storage.wall.getId(), name: 'empty view' });
      })
      .then(function( view ) {
        storage.views.push( view );

        return services.createRegion({
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

        return services.createRegion({
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

        return services.createCard({
          wall: storage.wall.getId(),
          title: 'First Card'
        });
      })
      .then(function( card ) {
        storage.card = card;
        storage.cards.push( card );

        return services.createCard({
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
