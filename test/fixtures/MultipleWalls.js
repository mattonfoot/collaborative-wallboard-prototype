var RSVP = require('rsvp');
var Promise = RSVP.Promise;

function fixture( ctx, storedName ) {
  var services = ctx.services;

  var storage = ctx.storage = {
    walls: [],
    boards: [],
    regions: [],
    cards: [],
    locations: []
  };

  return new Promise(function( resolve, reject ) {
    services
      .createWall({ name: 'first wall' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return services.createWall({ name: 'other wall' });
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        return services.createWall({ name: 'another wall' });
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
