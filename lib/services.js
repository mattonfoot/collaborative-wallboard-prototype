var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'Card', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
var topics = [ 'create', 'update' ];

function Services( queue, repository ) {
  var services = this;
  this.repository = repository;
  var queue = this.queue = queue;

  // setup events to trigger services
  models.forEach(function( model ) {
    setUpEventListeners( services, queue, model );
  });

  queue.subscribe( 'board.added', function( data ) {
    // services.addWallCardsToBoard( data.board, data.wall );
  });
}

// private

function setUpEventListeners( services, queue, type ) {
  topics.forEach(function( topic ) {
    var ev = type.toLowerCase() + '.' + topic;

    queue.subscribe( ev, function( ev ) {
      var handler = services[ topic + type ];

      if (!handler) return;

      var promise = handler.call( services, ev );

      if ( promise && promise.catch ) {
        promise.catch(function( error ) {
          queue.publish( ev + '.fail', error );
        });
      }
    });
  });
}

// public

// wall

Services.prototype.createWall = function( data ) {
  var services = this;
  var repository = this.repository;

  var queue = this.queue;

  var wall;
  return repository.createWall( data )
    .catch(function( error ) {
      queue.publish( 'wall.create.fail', error );
    });
};

Services.prototype.updateWall = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.getWall( data.wall )
    .then(function( resource ) {
      resource.update( data );

      return resource;
    })
    .catch(function( error ) {
      queue.publish( 'wall.update.fail', error );
    });
};

// board

Services.prototype.createView = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createView( data )
    .catch(function( error ) {
      queue.publish( 'view.create.fail', error );
    });
};

Services.prototype.updateView = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.getView( data.view )
    .then(function( resource ) {
      resource.update( data );

      return resource;
    })
    .catch(function( error ) {
      queue.publish( 'view.update.fail', error );
    });
};

// card

Services.prototype.createCard = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createCard( data )
    .catch(function( error ) {
      queue.publish( 'card.create.fail', error );
    });
};

Services.prototype.updateCard = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.getCard( data.card )
    .then(function( card ) {
      card.update( data );

      return card;
    })
    .catch(function( error ) {
      queue.publish( 'card.update.fail', error );
    });
};

// region

Services.prototype.createRegion = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createRegion( data )
    .catch(function( error ) {
      queue.publish( 'region.create.fail', error );
    });
};

Services.prototype.updateRegion = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.getRegion( data.region )
    .then(function( region ) {
      region.update( data );

      return region;
    })
    .catch(function( error ) {
      queue.publish( 'region.update.fail', error );
    });
};


/*


// cardlocations

Services.prototype.addWallCardsToBoard = function( boardid, wallid ) {
  var services = this;
  var queries = this._queries;

  var promises = [
    queries.getBoard( boardid ),
    queries.getWall( wallid )
  ];

  var board;
  RSVP.all( promises )
    .then(function( resources ) {
      board = resources[ 0 ];
      // wall.getCards()
      return queries.getPocketsForWall( resources[ 1 ] );
    })
    .then(function( cards ) {
      if ( !cards.length ) return board;

      return services.addPocketsToBoard( board, cards );
    });
};

Services.prototype.addPocketToBoards = function( boards, pocket ) {
  var commands = this._commands;

  var queue = this._queue;

  var locations = [];
  var deferred = RSVP.defer();

  deferred.resolve();
  var promise = deferred.promise;

  boards.forEach(function( board ) {
    promise = promise
      .then(function( locations ) {
        return commands.createCardLocation( { board: board.getId(), pocket: pocket.getId() } );
      })
      .catch(function( error ) {
        queue.publish( 'cardlocation.create.fail', { message: error.message, stack: error.stack } );
      })
      .then(function( location ) {
        locations.push( location );

        return locations;
      });
  });

  return promise;
};

// board:created
Services.prototype.addPocketsToBoard = function( board, pockets ) {
  var commands = this._commands;

  var queue = this._queue;

  var locations = [];
  var deferred = RSVP.defer();

  deferred.resolve();
  var promise = deferred.promise;

  pockets.forEach(function( pocket ) {
    promise = promise
      .then(function( locations ) {
        return commands.createCardLocation( { board: board.getId(), pocket: pocket.getId() } );
      })
      .catch(function( error ) {
        queue.publish( 'cardlocation.create.fail', { message: error.message, stack: error.stack } );
      })
      .then(function( location ) {
        locations.push( location );

        return locations;
      });
  });

  return promise;
};






// pockets

// pocket:create

// pocket:update
Services.prototype.updatePocket = function( data ) {
  var queries = this._queries;

  var queue = this._queue;

  return queries.getPocket( data.id )
    .then(function( pocket ) {
      pocket.update( data );

      return pocket;
    });
};






// regions

// region:create
Services.prototype.createRegion = function( data ) {
  var services = this;
  var commands = this._commands;

  var queue = this._queue;

  return commands.createRegion( data )
    .catch(function( error ) {
      queue.publish( 'region.create.fail', { message: error.message, stack: error.stack } );
    });
};

// region:update
Services.prototype.updateRegion = function( data ) {
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegion( data.id )
    .then(function( region ) {
      region.update( data );

      return region;
    });
};






// transforms

// transform:create
Services.prototype.createTransform = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.createTransform( data )
    .catch(function( error ) {
      queue.publish( 'transform.create.fail', { message: error.message, stack: error.stack } );
    });
};





// walls

// wall:update
*/

module.exports = Services;
