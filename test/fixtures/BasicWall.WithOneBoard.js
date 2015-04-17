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
      .createWall({ name: 'wall for board' })
      .then(function( wall ) {
        storage.wall = wall;
        storage.walls.push( wall );

        return services.createBoard({ wall: wall.getId(), name: storedName });
      })
      .then(function( board ) {
        storage.board = board;
        storage.boards.push( board );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
