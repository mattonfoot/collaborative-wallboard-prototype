var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// private methods

function get( queries, doctype, id ) {
  return new Promise(function( resolve, reject ) {
    queries._db.find( doctype, id ).then( resolve, reject );
  });
}

function getAll( queries, doctype ) {
  return new Promise(function( resolve, reject ) {
    queries._db.findMany( doctype ).then( resolve, reject );
  });
}

function getMany( queries, doctype, ids ) {
  return new Promise(function( resolve, reject ) {
    if (!ids.length) return resolve( [] );

    queries._db.findMany( doctype, ids ).then( resolve, reject );
  });
}

// Queries

function Queries( adapter ) {
  var queries = this;

  queries._db = adapter;
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
