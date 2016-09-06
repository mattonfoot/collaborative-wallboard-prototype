var RSVP = require('rsvp'),
    Promise = RSVP.Promise,
    Wall = require('./models/wall'),
    View = require('./models/view'),
    Region = require('./models/region'),
    Card = require('./models/card'),
    Transform = require('./models/transform');

// Repository

function Repository( queue ) {
  this.store = {
    wall: {},
    view: {},
    region: {},
    card: {},
    transform: {}
  };

  this.queue = queue;
}

Repository.prototype.createWall = function( data ) {
  return create( this, 'wall', data );
};

Repository.prototype.getWall = function( id ) {
  return get( this, 'wall', id );
};

Repository.prototype.getAllWalls = function() {
  return getAll( this, 'wall' );
};

Repository.prototype.createView = function( data ) {
  return create( this, 'view', data );
};

Repository.prototype.getView = function( id ) {
  return get( this, 'view', id );
};

Repository.prototype.getViews = function( ids ) {
  return getAll( this, 'view', ids );
};

Repository.prototype.createCard = function( data ) {
  return create( this, 'card', data );
};

Repository.prototype.getCard = function( id ) {
  return get( this, 'card', id );
};

Repository.prototype.getCards = function( ids ) {
  return getAll( this, 'card', ids );
};

Repository.prototype.createRegion = function( data ) {
  return create( this, 'region', data );
};

Repository.prototype.getRegion = function( id ) {
  return get( this, 'region', id );
};

Repository.prototype.getRegions = function( ids ) {
  return getAll( this, 'region', ids );
};

Repository.prototype.createTransform = function( data ) {
  return create( this, 'transform', data );
};

Repository.prototype.getTransform = function( id ) {
  return get( this, 'transform', id );
};

Repository.prototype.getTransforms = function( ids ) {
  return getAll( this, 'transform', ids );
};





// private methods

var factories = {
  'wall': Wall,
  'view': View,
  'region': Region,
  'card': Card,
  'transform': Transform
};

function create( Repository, model, data ) {
  var store = Repository.store[ model ];

  return new Promise(function( resolve, reject ) {
    var resource = factories[ model ].constructor( data, Repository.queue );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
}

function source( Repository, model, events ) {
  var store = Repository.store[ model ];

  return new Promise(function( resolve, reject ) {
    var resource = factories[ model ].eventsource( Repository.queue, events );

    store[ resource.getId() ] = resource;

    resolve( resource );
  });
}

function get( Repository, model, id ) {
  var ids = [ id ];

  return getAll( Repository, model, ids )
    .then(function( resources ) {
      if ( resources && resources.length ) return resources[ 0 ];

      throw new Error( 'Unknown '+ model +' for ' + id );
    });
}

function getAll( Repository, model, ids ) {
  return getAllFromCache( Repository, model, ids )
    .then(function( resources ) {
      if ( resources && resources.length ) return resources;

      return getAllFromEventSource( Repository, model, ids );
    })
    .then(function( resources ) {
      if ( resources ) return resources;

      throw new Error( 'Unknown '+ model +' for ' + ids.join(', ') );
    });
}

function getAllFromCache( Repository, model, ids ) {
  var store = Repository.store[ model ];

  return new Promise(function( resolve, reject ) {
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
  });
}

function getAllFromEventSource( Repository, model, ids ) {
  return new Promise(function( resolve, reject ) {
    if ( !Repository.queue.db ) resolve( [] );

    Repository.queue.db.allDocs({
        include_docs: true //,
        // {{ channelName }}_{{ topic[ 0 ] }}_{{ uuid }}_{{ ticks }}_{{ topic[ 1 ] }}
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
          events.sort( sortByTicks );

          promises.push( source( Repository, model, events ) );
        }

        return RSVP.all( promises );
      })
      .then(function( resources ) {
        var store = Repository.store[ model ];
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

function sortByTicks( a, b ) {
  // sort by timeStamp
  if (new Date( a.timeStamp ) > new Date( b.timeStamp )) return 1;
  if (new Date( a.timeStamp ) < new Date( b.timeStamp )) return -1;

  // timeStamps are the same sort by ticks
  if (a.ticks > b.ticks) return 1;
  if (a.ticks < b.ticks) return -1;

  // if timeStamps and ticks are all equal then who knows
  return 0;
}

module.exports = Repository;
