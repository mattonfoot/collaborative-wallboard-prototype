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

        return interface.createView({ wall: storage.wall.getId(), name: storedName });
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
