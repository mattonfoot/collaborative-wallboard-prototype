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

Queries.prototype.getWall = function( id, attempts ) {
  var store = this.store[ 'wall' ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resource = store[ id ];

      if ( !resource ) return reject( new Error( 'Unknown wall for ID ' + id ) );

      resolve( resource );
    }, 0);
  });
};

Queries.prototype.getAllWalls = function() {
  var store = this.store[ 'wall' ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resources = [];

      for ( var id in store ) {
        resources.push( store[ id ] );
      }

      resolve( resources );
    });
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
    setTimeout(function() {
      var resource = store[ id ];

      if ( !resource ) return reject( new Error( 'Unknown view for ID ' + id ) );

      resolve( resource );
    });
  });
};

Queries.prototype.getViews = function( ids ) {
  var store = this.store[ 'view' ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resources =  ids.map(function( id ) {
        return store[ id ];
      });

      resolve( resources );
    });
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
    //setTimeout(function() {
      var resource = store[ id ];

      if ( !resource ) return reject( new Error( 'Unknown card for ID ' + id ) );

      resolve( resource );
    //});
  });
};

Queries.prototype.getCards = function( ids ) {
  var store = this.store[ 'card' ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resources =  ids.map(function( id ) {
        return store[ id ];
      });

      resolve( resources );
    });
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
    setTimeout(function() {
      var resource = store[ id ];

      if ( !resource ) return reject( new Error( 'Unknown region for ID ' + id ) );

      resolve( resource );
    });
  });
};

Queries.prototype.getRegions = function( ids ) {
  var store = this.store[ 'region' ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resources =  ids.map(function( id ) {
        return store[ id ];
      });

      resolve( resources );
    });
  });
};

module.exports = Queries;
