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
        
        return services.createBoard({ wall: storage.wall.getId(), name: 'board for cards and regions' });
      })
      .then(function( board ) {
        storage.board = board;
        storage.boards.push( board );

        return services.createBoard({ wall: storage.wall.getId(), name: 'empty board' });
      })
      .then(function( board ) {
        storage.boards.push( board );

        return services.createRegion({ board: storage.board.getId(), label: 'Red Region', color: 'red', value: 'one',
            width: 200, height: 200, x: 200, y: 200 });
      })
      .then(function( region ) {
        storage.region = region;
        storage.regions.push( region );

        return services.createRegion({ board: storage.board.getId(), label: 'Blue Region', color: 'blue', value: 'two',
            width: 200, height: 200, x: 500, y: 500 });
      })
      .then(function( region ) {
        storage.regions.push( region );

        return services.createPocket({ wall: storage.wall.getId(), title: 'First Card', x: 10, y: 10 });
      })
      .then(function( card ) {
        storage.card = card;
        storage.cards.push( card );

        return services.createPocket({ wall: storage.wall.getId(), title: 'Second Card', x: 210, y: 210 });
      })
      .then(function( card ) {
        storage.cards.push( card );

        resolve( storage );
      })
      .catch( reject );
  });
}

module.exports = fixture;
