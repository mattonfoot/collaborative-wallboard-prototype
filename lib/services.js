var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
var topics = [ 'create', 'update', 'display', 'unlink', 'move', 'resize', 'transform' ];

function Services( queue, queries, commands, interface ) {
  var services = this;
  this._interface = interface;
  this._commands = commands;
  this._queries = queries;
  var queue = this._queue = queue;

  // setup events to trigger services
  models.forEach(function( model ) {
      setUpEventListeners( services, queue, model );
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
          queue.publish( ev + '.fail', { message: error.message, stack: error.stack } );
        });
      }
    });
  });
}

// public

// board:create
Services.prototype.createBoard = function( data ) {
  var phrase;
  if ( data.transform ) {
      phrase = data.transform;
      delete data.transform;
  }

  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  var board;
  return commands.createBoard( data )
    .catch(function( error ) {
      queue.publish( 'board.create.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( resource ) {
      board = resource;

      if ( phrase && phrase !== '' ) {
        return services.createTransform({ board: board.getId(), phrase: phrase });
      }
    })
    .then(function() {
      return queries.getWall( board.getWall() );
    })
    .then(function( wall ) {
      return queries.getPocketsForWall( wall );
    })
    .then(function( cards ) {
      if ( !cards.length ) return board;

      return services.addPocketsToBoard( board, cards ); // board.addCards( cards );
    });
};

// board:update
Services.prototype.updateBoard = function( data ) {
  var phrase;
  if ( data.transform ) {
    phrase = data.transform;

    delete data.transform;
  }

  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return commands.updateBoard( data )
    .then(function( board ) {
      queue.publish( 'board.updated', data );

      if ( phrase && phrase !== '' ) {
        services.createTransform({ board: board.getId(), phrase: phrase });
      }

      return board;
    });
};





// cardlocations

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

// cardlocation:move
Services.prototype.moveCardLocation = function( info ) {
  var services = this;
  var queries = this._queries;
  var commands = this._commands;
  var queue = this._queue;

  return queries.getCardLocation( info.id )
    .then(function( cardlocation ) {
      if ( cardlocation.x != info.x || cardlocation.y != info.y ) {
        cardlocation.x = info.x;
        cardlocation.y = info.y;

        return commands.updateCardLocation( cardlocation )
          .then(function( location ) {
            queue.publish( 'cardlocation.moved', info );
          });
      }
    });
};






// pockets

// pocket:create
Services.prototype.createPocket = function( data ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  var pocket;
  return commands.createPocket( data )  // --> pocket:created
    .catch(function( error ) {
      queue.publish( 'pocket.create.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( resource ) {
      pocket = resource;

      return queries.getWall( pocket.getWall() );
    })
    .then(function( wall ) {
      return queries.getBoardsForWall( wall );
    })
    .then(function( boards ) {
      return services.addPocketToBoards( boards, pocket );
    })
    .then(function() {
      return queries.getPocket( pocket.getId() );
    });
};

// pocket:update
Services.prototype.updatePocket = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.updatePocket( data )
    .then(function( pocket ) {
      queue.publish( 'pocket.updated', data );
    });
};

// pocket:update
Services.prototype.transformPocket = function( data ) {
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getPocket( data.card )
    .then(function( card ) {
      switch ( data.op ) {
        case 'set':
          if ( card[ data.property ] !== data.value ) {
            card[ data.property ] = data.value;

            return commands.updatePocket( card );
          }
        break;

        case 'unset':
          if ( card[ data.property ] === data.value ) {
            delete card[ data.property ];

            return commands.updatePocket( card );
          }
        break;
      }
    })
    .catch(function( error ) {
      queue.publish( 'pocket.transform.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( card ) {
      queue.publish( 'pocket.transformed', data );
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

// region:move
Services.prototype.moveRegion = function( info ) {
  var queries = this._queries;
  var commands = this._commands;

  var queue = this._queue;


  return queries.getRegion( info.id )
    .then(function( region ) {
      if ( region.x === info.x && region.y === info.y ) {
        return region;
      }

      region.x = info.x;
      region.y = info.y;

      return commands.updateRegion( region );
    })
    .catch(function( error ) {
      queue.publish( 'region.move.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( region ) {
      queue.publish( 'region.moved', info );
    });
};

// region:resize
Services.prototype.resizeRegion = function( info ) {
  var queries = this._queries;
  var commands = this._commands;

  var queue = this._queue;

  return queries.getRegion( info.id )
    .then(function( region ) {
      if ( region.height === info.height && region.width === info.width ) {
          return region;
      }

      region.height = info.height;
      region.width = info.width;

      return commands.updateRegion( region );
    })
    .catch(function( error ) {
      queue.publish( 'region.resize.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( region ) {
      queue.publish( 'region.resized', info );
    });
};

// region:update
Services.prototype.updateRegion = function( data ) {
  var queries = this._queries;
  var commands = this._commands;

  var queue = this._queue;

  return queries.getRegion( data.id )
    .then(function( region ) {
      region.label = label;
      region.value = value;
      region.color = color;

      return commands.updateRegion( region );
    })
    .catch(function( error ) {
      queue.publish( 'region.update.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( region ) {
      queue.publish( 'region.updated', data );
    });
};






// transforms

Services.prototype.createTransform = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.createTransform( data )
    .catch(function( error ) {
      queue.publish( 'transform.create.fail', { message: error.message, stack: error.stack } );
    });
};

// transform:unlink
Services.prototype.unlinkTransform = function( id ) {
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getTransform( id )
    .then(function( transform ) {
      return commands.deleteTransform( id )
        .then(function( transform ) {
          queue.publish( 'transform.unlinked', id );
        })
        .catch(function( error ) {
          queue.publish( 'transform.unlink.fail', { message: error.message, stack: error.stack } );
        });
    });
};





// walls

// wall:create
Services.prototype.createWall = function( data ) {
  var services = this;
  var commands = this._commands;

  var queue = this._queue;

  return commands.createWall( data )
    .catch(function( error ) {
      queue.publish( 'wall.create.fail', { message: error.message, stack: error.stack } );
    });
};

// wall:update
Services.prototype.updateWall = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.updateWall( data )
    .catch(function( error ) {
      queue.publish( 'wall.update.fail', { message: error.message, stack: error.stack } );
    })
    .then(function( wall ) {
      queue.publish( 'wall.updated', data );

      return wall;
    });
};

module.exports = Services;
