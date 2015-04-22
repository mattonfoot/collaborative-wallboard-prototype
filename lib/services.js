var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

// Application

function Services( interface, commands, queries, queue ) {
  this._interface = interface;
  this._commands = commands;
  this._queries = queries;
  this._queue = queue;
}

// board:new
Services.prototype.newBoard = function() {
  if ( this._interface.displayBoardCreator() ) {
    this._queue.publish( 'boardcreator:displayed' );
  }
};

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
      queue.publish( 'board:create:fail', error );
    })
    .then(function( resource ) {
      board = resource;

      if ( phrase && phrase !== '' ) {
        return services.createTransform({ board: board.getId(), phrase: phrase });
      }
    })
    .then(function() {
      queue.publish( 'board:created', board );  // --> board:created

      if ( interface.addBoard( board ) ) {
        queue.publish( 'board:added', board );  // --> board:added
      }

      return queries.getWall( board.getWall() );
    })
    .then(function( wall ) {
      return queries.getPocketsForWall( wall );
    })
    .then(function( cards ) {
      if ( !cards.length ) return board;

      return services.addPocketsToBoard( board, cards );
    })
    .then(function( locations ) {
      return board;
    });
};

// board:edit
Services.prototype.editBoard = function( id ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getBoard( id )
    .then(function( board ) {
      if ( interface.displayBoardEditor( board ) ) {
        queue.publish( 'boardeditor:displayed', board );
      }

      return board;
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
      queue.publish( 'board:updated', board );  // --> board:updated

      if ( phrase && phrase !== '' ) {
        services.createTransform({ board: board.getId(), phrase: phrase }); // --> transform:created
      }

      return board;
    });
};

// board:display
// board:created
Services.prototype.displayBoard = function( id ) {
  var services = this;
  var interface = this._interface;
  var queries = this._queries;

  var queue = this._queue;

  var board;
  return queries.getBoard( id )
    .then(function( resource ) {
      board = resource;

      if ( interface.displayBoard( board ) ) {
        return services.displayCardLocations( board )
          .then(function() {
            return services.displayRegions( board );
          })
          .then(function() {
            queue.publish( 'board:displayed', board );  // --> board:displayed

            if ( interface.enableControls() ) {
              queue.publish( 'controls:enabled' );
            }
          });
      }
    })
    .then(function() {
      return board;
    });
};

// board:select
Services.prototype.selectBoard = function( wall ) {
  var queries = this._queries;
  var interface = this._interface;

  var queue = this._queue;

  return queries.getBoardsForWall( wall )
    .then(function( boards ) {
      if ( boards.length && interface.displayBoardSelector( boards ) ) {
        queue.publish( 'boardselector:displayed', boards );  // --> boardselector:displayed
      }

      return wall;
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
        queue.publish( 'cardlocation:created:fail', error );
      })
      .then(function( location ) {
        queue.publish( 'cardlocation:created', location );  // --> cardlocation:created

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
  var promise = Promise.resolve( locations );

  pockets.forEach(function( pocket ) {
    promise.then(function( locations ) {
        return commands.createCardLocation( { board: board.getId(), pocket: pocket.getId() } );
      })
      .catch(function( error ) {
        queue.publish( 'cardlocation:created:fail', error );
      })
      .then(function( location ) {
        queue.publish( 'cardlocation:created', location );  // --> cardlocation:created

        locations.push( location );

        return locations;
      });
  });

  return promise;
};

// cardlocation:created
Services.prototype.displayCardLocation = function( location ) {
  return callDisplayCardLocationWithPocket( this, location )
    .catch(function( error ) {
      queue.publish( 'cardlocation:display:fail', error );
    });
};

// board:displayed
Services.prototype.displayCardLocations = function( board ) {
  var services = this;
  var queries = this._queries;

  return queries.getCardLocationsForBoard( board )
    .then(function( locations ) {
      var promise = Promise.resolve();

      locations.forEach(function( location ) {
        promise.then(function() {
          return callDisplayCardLocationWithPocket( services, location );
        });
      });

      return promise;
    })
    .catch(function( error ) {
      queue.publish( 'cardlocations:display:fail', error );
    });
};

function callDisplayCardLocationWithPocket( services, location ) {
  var queries = services._queries;
  var interface = services._interface;
  var queue = services._queue;

  return queries.getPocket( location.getPocket() )
    .then(function( pocket ) {
      if ( interface.displayCardLocation( location, pocket ) ) {
        queue.publish( 'cardlocation:displayed', location );
      }

      return location;
    });
}

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
            queue.publish( 'cardlocation:updated', location );  // --> cardlocation:updated
          });
      }
    });
};






// pockets

// pocket:new
Services.prototype.newPocket = function() {
  if ( this._interface.displayPocketCreator() ) {
    this._queue.publish( 'pocketcreator:displayed' );
  }
};

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
      queue.publish( 'pocket:create:fail', error );
    })
    .then(function( resource ) {
      pocket = resource;

      queue.publish( 'pocket:created', pocket );

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
    /*
    .then(function( locations ) {
      return services.displayCardLocations( locations );
    })
    */;
};

// pocket:edit
Services.prototype.editPocket = function( id ) {
  var queries = this._queries;
  var interface = this._interface;

  var queue = this._queue;

  return queries.getPocket( id )
    .then(function( pocket ) {
      if ( interface.displayPocketEditor( pocket ) ) {
        queue.publish( 'pocketeditor:displayed', pocket );
      }

      return pocket;
    });
};

// pocket:update
Services.prototype.updatePocket = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.updatePocket( data )
    .then(function( pocket ) {
      queue.publish( 'pocket:updated', pocket ); // --> region:updated
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
      queue.publish( 'pockettransform:fail', error );
    })
    .then(function( card ) {
      queue.publish( 'pocket:transformed', card ); // --> region:updated
    });
};






// regions

// region:created
Services.prototype.displayRegion = function( id ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegion( id )
    .then(function( region ) {
      if ( interface.displayRegion( region ) ) {
        queue.publish( 'region:displayed', region ); // --> region:displayed
      }

      return region;
    });
};

// board:displayed
Services.prototype.displayRegions = function( board ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegionsForBoard( board )
    .then(function( regions ) {
      if ( interface.displayRegions( regions ) ) {
        regions.forEach(function( region ) {
          queue.publish( 'region:displayed', region ); // --> region:displayed
        });
      }

      return regions;
    });
};
// region:new
Services.prototype.newRegion = function() {
  if ( this._interface.displayRegionCreator() ) {
    this._queue.publish( 'regioncreator:displayed' );
  }
};

// region:create
Services.prototype.createRegion = function( data ) {
  var services = this;
  var commands = this._commands;

  var queue = this._queue;

  return commands.createRegion( data )
    .then(function( region ) {
      queue.publish( 'region:created', region ); // --> region:created

      return services.displayRegion( region.getId() );
    })
    .catch(function( error ) {
      queue.publish( 'region:create:fail', error );
    });
};

// region:edit
Services.prototype.editRegion = function( id ) {
  var queries = this._queries;
  var interface = this._interface;

  var queue = this._queue;

  return queries.getRegion( id )
    .then(function( region ) {
      if ( interface.displayRegionEditor( wall ) ) {
        queue.publish( 'regioneditor:displayed', wall );
      }

      return wall;
    });
};

// region:move
Services.prototype.moveRegion = function( info ) {
  var services = this;
  var queries = this._queries;

  var queue = this._queue;


  return queries.getRegion( info.id )
    .then(function( region ) {
      if ( region.x === info.x && region.y === info.y ) {
        return region;
      }

      region.x = info.x;
      region.y = info.y;

      return services.updateRegion( region );  // --> region:updated
    });
};

// region:resize
Services.prototype.resizeRegion = function( info ) {
  var services = this;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegion( info.id )
    .then(function( region ) {
      if ( region.height === info.height && region.width === info.width ) {
          return region;
      }

      region.height = info.height;
      region.width = info.width;

      return services.updateRegion( region );  // --> region:updated
    });
};

// region:update
Services.prototype.updateRegion = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.updateRegion( data )
    .then(function( region ) {
      queue.publish( 'region:updated', region ); // --> region:updated
    });
};






// transforms

Services.prototype.createTransform = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.createTransform( data )
    .then(function( transform ) {
      queue.publish( 'transform:created', transform ); // --> transform:created
    })
    .catch(function( error ) {
      queue.publish( 'transform:create:fail', error );
    });
};

// transform:unlink
Services.prototype.unlinkTransform = function( id ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getTransform( id )
    .then(function( transform ) {
      return commands.deleteTransform( id )
        .then(function( transform ) {
          queue.publish( 'transform:deleted', transform ); // --> transform:deleted
        });
    });
};





// walls

// wall:new
Services.prototype.newWall = function() {
  if ( this._interface.displayWallCreator() ) {
    this._queue.publish( 'wallcreator:displayed' );
  }
};

// wall:create
Services.prototype.createWall = function( data ) {
  var services = this;
  var commands = this._commands;

  var queue = this._queue;

  return commands.createWall( data )
    .then(function( wall ) {
      queue.publish( 'wall:created', wall ); // --> wall:created

      return services.displayWall( wall.getId() )
    })
    .catch(function( error ) {
      queue.publish( 'wall:create:fail', error );
    });
};

// wall:edit
Services.prototype.editWall = function( id ) {
  var queries = this._queries;
  var interface = this._interface;

  var queue = this._queue;

  return queries.getWall( id )
    .then(function( wall ) {
      if ( interface.displayWallEditor( wall ) ) {
        queue.publish( 'walleditor:displayed', wall );
      }

      return wall;
    });
};

// wall:update
Services.prototype.updateWall = function( data ) {
  var commands = this._commands;

  var queue = this._queue;

  return commands.updateWall( data )
    .then(function( wall ) {
      queue.publish( 'wall:updated', wall );  // --> wall:updated

      return wall;
    });
};

// wall:select
Services.prototype.selectWall = function( id ) {
  var queries = this._queries;
  var interface = this._interface;

  var queue = this._queue;

  return queries.getAllWalls()
    .then(function( walls ) {
      if ( interface.displayWallSelector( walls ) ) {
        queue.publish( 'wallselector:displayed', walls );
      }

      return walls;
    });
};

// wall:display
// wall:created
Services.prototype.displayWall = function( id ) {
  var services = this;
  var interface = this._interface;
  var commands = this._commands;
  var queries = this._queries;

  var queue = this._queue;

  var wall;
  return queries.getWall( id )
    .then(function( resource ) {
      wall = resource;

      if ( interface.displayWall( wall ) ) {
        queue.publish( 'wall:displayed', wall );
      }

      if ( !wall.boards.length ) {
        queue.publish( 'wall:firsttime', wall );  // --> wall:firsttime

        return services.newBoard();
      } else {
        return services.displayBoard( wall.getBoards()[0] );
      }
    })
    .then(function() {
      return wall;
    });
};

module.exports = Services;
