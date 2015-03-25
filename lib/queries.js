var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// private methods

function get( queries, doctype, id ) {
  return new Promise(function( resolve, reject ) {
      queries._db.find( doctype, id )
          .then(function( data ) {
            queries.cache[ doctype ][ data.id ] = data;

            resolve( data );
          })
          .catch( reject );
  });
}

function getAll( queries, doctype ) {
  return new Promise(function( resolve, reject ) {
      queries._db.findMany( doctype )
          .then(function( data ) {
            queries.cache[ doctype ][ data.id ] = data;

            resolve( data );
          })
          .catch( reject );
  });
}

function getMany( queries, doctype, ids ) {
  return new Promise(function( resolve, reject ) {
      if (!ids.length) {
          resolve([]);
      }

      var out = [];
      var missingIds = [];
      ids.forEach(function( id ) {
        var data = queries.cache[ doctype ][ id ];

        if (data) {
          out.push( data );
        } else {
          missingIds.push( id );
        }
      });

      if ( !missingIds.length ) {
        return resolve( out );
      }

      queries._db.findMany( doctype, missingIds )
          .then(function( rows ) {
            rows.forEach(function( data ) {
              queries.cache[ doctype ][ data.id ] = data;

              out.push( data );
            });

            resolve( out );
          })
          .catch( reject );
  });
}

// Queries

function Queries( adapter ) {
  this._db = adapter;

  this.cache = {
    wall: {},
    board: {},
    pocket: {},
    cardlocation: {},
    region: {}
  };
}

Queries.prototype.getBoard = function( id ) {
  return get( this, 'board', id );
};

Queries.prototype.getBoardsForWall = function( wall ) {
  return getMany( this, 'board', wall.getBoards() );
};

Queries.prototype.getCardLocation = function( id ) {
  return get( this, 'cardlocation', id );
};

Queries.prototype.getCardLocationsForBoard = function( board ) {
  return getMany( this, 'cardlocation', board.getCardLocations() );
};

Queries.prototype.getPocket = function( id ) {
  return get( this, 'pocket', id );
};

Queries.prototype.getPocketsForWall = function( wall ) {
  return getMany( this, 'pocket', wall.getPockets() );
};

Queries.prototype.getRegion = function( id ) {
  return get( this, 'region', id );
};

Queries.prototype.getRegionsForBoard = function( board ) {
  return getMany( this, 'region', board.getRegions() );
};

Queries.prototype.getTransformsForBoard = function( board ) {
  return getMany( this, 'transform', board.getTransforms() );
};

Queries.prototype.getAllTransforms = function() {
  return getAll( this, 'transform' );
};

Queries.prototype.getWall = function( id ) {
  return get( this, 'wall', id );
};

Queries.prototype.getAllWalls = function() {
  return getAll( this, 'wall' );
};

module.exports = Queries;
