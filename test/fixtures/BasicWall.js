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
      .createWall({ name: storedName })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
