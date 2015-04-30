var RSVP = require('rsvp'),
    Promise = RSVP.Promise,
    Wall = require('../lib/models/wall'),
    View = require('../lib/models/view'),
    Region = require('../lib/models/region'),
    Card = require('../lib/models/card');

// Queries

function Queries( queue ) {
  var queries = this;

  this.store = {
    wall: {},
    view: {},
    region: {},
    card: {}
  };

  queries.queue = queue;
}

Queries.prototype.createWall = function( data ) {
  var queue = this.queue;
  var store = this.store[ 'wall' ];

  return new Promise(function( resolve, reject ) {
    var resource = Wall.constructor( data, queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
};

Queries.prototype.getWall = function( id ) {
  var store = this.store[ 'wall' ];

  return new Promise(function( resolve, reject ) {
    var resource = store[ id ];

    if ( !resource ) return reject( new Error( 'Unknown wall for ID ' + id ) );

    resolve( resource );
  });
};

Queries.prototype.getAllWalls = function() {
  var store = this.store[ 'wall' ];

  return new Promise(function( resolve, reject ) {
    var resources = [];

    for ( var id in store ) {
      resources.push( store[ id ] );
    }

    resolve( resources );
  });
};

Queries.prototype.createView = function( data ) {
  var queue = this.queue;
  var store = this.store[ 'view' ];

  return new Promise(function( resolve, reject ) {
    var resource = View.constructor( data, queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
};

Queries.prototype.getView = function( id ) {
  var store = this.store[ 'view' ];

  return new Promise(function( resolve, reject ) {
    var resource = store[ id ];

    if ( !resource ) return reject( new Error( 'Unknown view for ID ' + id ) );

    resolve( resource );
  });
};


Queries.prototype.createCard = function( data ) {
  var queue = this.queue;
  var store = this.store[ 'card' ];

  return new Promise(function( resolve, reject ) {
    var resource = Card.constructor( data, queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
};

Queries.prototype.getCard = function( id ) {
  var store = this.store[ 'card' ];

  return new Promise(function( resolve, reject ) {
    var resource = store[ id ];

    if ( !resource ) return reject( new Error( 'Unknown card for ID ' + id ) );

    resolve( resource );
  });
};

Queries.prototype.getCards = function( ids ) {
  var store = this.store[ 'card' ];

  return new Promise(function( resolve, reject ) {
    var resources =  ids.map(function( id ) {
      return store[ id ];
    });

    resolve( resources );
  });
};


Queries.prototype.createRegion = function( data ) {
  var queue = this.queue;
  var store = this.store[ 'region' ];

  return new Promise(function( resolve, reject ) {
    var resource = Region.constructor( data, queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
};

Queries.prototype.getRegion = function( id ) {
  var store = this.store[ 'region' ];

  return new Promise(function( resolve, reject ) {
    var resource = store[ id ];

    if ( !resource ) return reject( new Error( 'Unknown region for ID ' + id ) );

    resolve( resource );
  });
};

Queries.prototype.getRegions = function( ids ) {
  var store = this.store[ 'region' ];

  return new Promise(function( resolve, reject ) {
    var resources =  ids.map(function( id ) {
      return store[ id ];
    });

    resolve( resources );
  });
};

/*
Queries.prototype.getAllWalls = function() {
  return getAll( this, 'wall' );
};

Queries.prototype.createBoard = function( data ) {
  return new Promise(function( resolve, reject ) {
    resolve( Board.constructor( data ) );
  });
}

Queries.prototype.createRegion = function( data ) {
  return new Promise(function( resolve, reject ) {
    resolve( Region.constructor( data ) );
  });
}

Queries.prototype.createCard = function( data ) {
  return new Promise(function( resolve, reject ) {
    resolve( Card.constructor( data ) );
  });
}

Queries.prototype.getBoard = function( id ) {
  return get( this, 'board', id );
};

Queries.prototype.getBoardsForWall = function( wall ) {
  return getMany( this, 'board', wall.getBoards() );
};

Queries.prototype.getCardLocation = function( card, board ) {
  var queries = this;

  return get( this, 'pocket', card )
    .then(function( pocket ) {
      return getMany( queries, 'cardlocation', pocket.getCardLocations() );
    })
    .then(function( locations ) {
      var out;

      locations.forEach(function( location ) {
        if ( location.getBoard() === board ) {
          out = location;
          return false;
        }
      });

      return out;
    });
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
*/

module.exports = Queries;
