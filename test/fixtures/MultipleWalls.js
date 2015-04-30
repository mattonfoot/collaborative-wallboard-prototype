var RSVP = require('rsvp');
var Promise = RSVP.Promise;

function fixture( ctx, storedName ) {
  var interface = ctx.interface;

  var storage = ctx.storage = {
    walls: [],
    boards: [],
    regions: [],
    cards: [],
    locations: []
  };

  return new Promise(function( resolve, reject ) {
    interface
      .createWall({ name: 'first wall' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return interface.createWall({ name: 'other wall' });
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        return interface.createWall({ name: 'another wall' });
      })
      .then(function( wall ) {
        storage.walls.push( wall );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
