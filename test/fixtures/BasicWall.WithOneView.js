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

        return services.createView({ wall: storage.wall.getId(), name: storedName });
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
