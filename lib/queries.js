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
  return create( this, 'wall', data );
};

Queries.prototype.getWall = function( id ) {
  return get( this, 'wall', id );
};

Queries.prototype.getAllWalls = function() {
  return getAll( this, 'wall' );
};

Queries.prototype.createView = function( data ) {
  return create( this, 'view', data );
};

Queries.prototype.getView = function( id ) {
  return get( this, 'view', id );
};

Queries.prototype.getViews = function( ids ) {
  return getAll( this, 'view', ids );
};

Queries.prototype.createCard = function( data ) {
  return create( this, 'card', data );
};

Queries.prototype.getCard = function( id ) {
  return get( this, 'card', id );
};

Queries.prototype.getCards = function( ids ) {
  return getAll( this, 'card', ids );
};

Queries.prototype.createRegion = function( data ) {
  return create( this, 'region', data );
};

Queries.prototype.getRegion = function( id ) {
  return get( this, 'region', id );
};

Queries.prototype.getRegions = function( ids ) {
  return getAll( this, 'region', ids );
};





// private methods

var factories = {
  'wall': Wall,
  'view': View,
  'region': Region,
  'card': Card
};

function create( queries, model, data ) {
  var store = queries.store[ model ];

  return new Promise(function( resolve, reject ) {
    var resource = factories[ model ].constructor( data, queries.queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
}

function source( queries, model, events ) {
  var store = queries.store[ model ];

  return new Promise(function( resolve, reject ) {
    var resource = factories[ model ].eventsource( queries.queue, events );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
}

function get( queries, model, id ) {
  return getFromCache( queries, model, id )
    .then(function( resource ) {
      if ( resource ) return resource;

      return getFromEventSource( queries, model, id );
    })
    .then(function( resource ) {
      if ( resource ) return resource;

      throw new Error( 'Unknown '+ model +' for ID ' + id );
    });
}

function getFromCache( queries, model, id ) {
  var store = queries.store[ model ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resource = store[ id ];

      resolve( resource );
    }, 0);
  });
}

function getFromEventSource( queries, model, resourceId ) {
  return new Promise(function( resolve, reject ) {
    if ( !queries.queue.db ) resolve( [] );

    queries.queue.db.allDocs({
        include_docs: true,
        // vuu.se_wall_280c7b34-5c7a-4d2e-8797-d9ed41cda3fb_created_2015-05-02T19:32:52.400Z
        // startkey: 'vuu.se_' + model
      })
      .then(function( results ) {
        if ( !results.rows ) return resolve( [] );

        var sources = {};

        var resources = results.rows.forEach(function( result ) {
          var event = result.doc;
          var id = event.data[ model ];
          if ( id ) {
            var events = sources[ id ] = sources[ id ] || [];

            events.unshift( event );
          }
        });

        return sources;
      })
      .then(function( sources ) {
        var promises = [];
        for ( var id in sources ) {
          var events = sources[ id ];

          events.sort(function( a, b ) {
            if (a.timeStamp > b.timeStamp) return 1;
            if (a.timeStamp < b.timeStamp) return -1;
            return 0;
          });

          promises.push( source( queries, model, events ) );
        }

        return RSVP.all( promises );
      })
      .then(function( resources ) {
        var store = queries.store[ model ];
        var out;

        resources.forEach(function( resource ) {
          var id = resource.getId();
          store[ id ] = resource;

          if ( id === resourceId ) {
            out = resource;
          }
        });

        resolve( out );
      });
  });
}

function getAll( queries, model, ids ) {
  return getAllFromCache( queries, model, ids )
    .then(function( resources ) {
      if ( resources && resources.length ) return resources;

      return getAllFromEventSource( queries, model, ids );
    })
    .then(function( resources ) {
      if ( resources ) return resources;

      throw new Error( 'Unknown '+ model +' for ID ' + id );
    });
}

function getAllFromCache( queries, model, ids ) {
  var store = queries.store[ model ];

  return new Promise(function( resolve, reject ) {
    setTimeout(function() {
      var resources = [];

      if ( store ) {
        for ( var id in store ) {
          if ( !ids || ( ids && ~ids.indexOf( id ) ) ) {
            resources.push( store[ id ] );
          }
        }
      }

      if ( resources.length ) return resolve( resources );

      resolve();
    }, 0);
  });
}

function getAllFromEventSource( queries, model, ids ) {
  return new Promise(function( resolve, reject ) {
    if ( !queries.queue.db ) resolve( [] );

    queries.queue.db.allDocs({
        include_docs: true,
        // vuu.se_wall_280c7b34-5c7a-4d2e-8797-d9ed41cda3fb_created_2015-05-02T19:32:52.400Z
        // startkey: 'vuu.se_' + model
      })
      .then(function( results ) {
        if ( !results.rows ) return resolve( [] );

        var sources = {};

        var resources = results.rows.forEach(function( result ) {
          var event = result.doc;
          var id = event.data[ model ];
          if ( id ) {
            var events = sources[ id ] = sources[ id ] || [];

            events.push( event );
          }
        });

        return sources;
      })
      .then(function( sources ) {
        var promises = [];
        for ( var id in sources ) {
          var events = sources[ id ];

          events.sort(function( a, b ) {
            if (a.timeStamp > b.timeStamp) return 1;
            if (a.timeStamp < b.timeStamp) return -1;
            return 0;
          });

          promises.push( source( queries, model, events ) );
        }

        return RSVP.all( promises );
      })
      .then(function( resources ) {
        var store = queries.store[ model ];
        var out = [];

        resources.forEach(function( resource ) {
          var id = resource.getId();
          store[ id ] = resource;

          if ( !ids || ( ids && ~ids.indexOf( id ) ) ) {
            out.push( resource );
          }
        });

        resolve( out );
      });
  });
}

module.exports = Queries;
