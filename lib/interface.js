var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Wall', 'Board', 'Pocket', 'Region', 'CardLocation', 'Transform' ];
var topics = [ 'new', 'edit', 'display' ];

function Interface( queue, queries, ui ) {
  var interface = this;
  this._ui = ui;
  this._queries = queries;
  var queue = this._queue = queue;

  // responses to events

  queue.subscribe( 'wall.created', function() {
    interface.displayWall();
  });

  queue.subscribe( 'wall.displayed', function( wall ) {
    interface.displayBoardSelector( wall );
  });

  queue.subscribe( 'board.created', function( board ) {
    interface.addBoard( board );

    interface.displayBoard( board );
  });

  queue.subscribe( 'board.displayed', function( board ) {
    interface.enableControls( board );

    interface.displayRegions( board );
    /*
    return queries.getCardLocationsForBoard( board )
      .then(function( locations ) {
        return interface.displayCardLocations( locations );
      });
    */
  });

  queue.subscribe( 'region.created', function( region ) {
    interface.displayRegion( region );
  });

  // UI events that trigger services

  models.forEach(function( model ) {
    setUpEventListeners( interface, queue, model );
  });

  queue.subscribe( 'wall.select', function() {
    interface.displayWallSelector();
  });

}

// private

function setUpEventListeners( interface, queue, type ) {
  topics.forEach(function( topic ) {
    var ev = type.toLowerCase() + '.' + topic;

    queue.subscribe( ev, function( ev ) {
      var handler = interface[ topic + type ];

      if (!handler) return;

      var promise = handler.call( interface, ev );

      if ( promise && promise.catch ) {
        promise.catch(function( error ) {
          queue.publish( ev + '.fail', { message: error.message, stack: error.stack } );
        });
      }
    });
  });
}

// public

// wall:new
Interface.prototype.newWall = function() {
  if ( this._ui && this._ui.displayWallCreator() ) {
    this._queue.publish( 'wallcreator.displayed' );
  }
};

// wall:edit
Interface.prototype.editWall = function( id ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getWall( id )
    .then(function( wall ) {
      if ( ui && ui.displayWallEditor( wall ) ) {
        queue.publish( 'walleditor.displayed', id );
      }

      return wall;
    });
};

// wall:display
Interface.prototype.displayWall = function( id ) {
  var interface = this;
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  var wall;
  return queries.getWall( id )
    .then(function( resource ) {
      wall = resource;

      interface._wall = wall;
      interface._regions = [];
      interface._cardlocations = [];
      delete interface._board;

      if ( ui && ui.displayWall( wall ) ) {
        queue.publish( 'wall.displayed', id );
      }

      if ( !wall.getBoards().length ) {
        queue.publish( 'wall.firsttime', id );

        return interface.newBoard( id );
      } else {
        return interface.displayBoard( wall.getBoards()[0] );
      }
    })
    .then(function() {
      return wall;
    });
};

// wall:select
Interface.prototype.displayWallSelector = function( id ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getAllWalls()
    .then(function( walls ) {
      if ( ui && ui.displayWallSelector( walls ) ) {
        queue.publish( 'wallselector.displayed', walls ); // TODO: list of ids
      }

      return walls;
    });
};

// board:new
Interface.prototype.newBoard = function( wallid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getWall( wallid )
    .then(function( wall ) {
      if ( ui && ui.displayBoardCreator( wall ) ) {
        queue.publish( 'boardcreator.displayed', wallid );
      }

      return wall;
    });
};

// board:edit
Interface.prototype.editBoard = function( id ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getBoard( id )
    .then(function( board ) {
      if ( ui && ui.displayBoardEditor( board ) ) {
        queue.publish( 'boardeditor.displayed', board );
      }

      return board;
    });
};

Interface.prototype.displayBoardSelector = function( wallid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  var wall;
  return queries.getWall( wallid )
    .then(function( resource ) {
      wall = resource;

      return queries.getBoardsForWall( wall );
    })
    .then(function( boards ) {
      if ( boards.length && ui && ui.displayBoardSelector( wall, boards ) ) {
        queue.publish( 'boardselector.displayed', boards ); // TODO: list Ids
      }

      return wall;
    });
};

// board:display
// board:created
Interface.prototype.displayBoard = function( id ) {
  var interface = this;
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  var board;
  return queries.getBoard( id )
    .then(function( resource ) {
      board = resource;

      if ( !interface._wall || board.getWall() !== interface._wall.getId() ) {
        return;
      }

      interface._board = board;
      interface._regions = [];
      interface._cardlocations = [];

      if ( ui && ui.displayBoard( board ) ) {
        queue.publish( 'board.displayed', id );
      }
    })
    .then(function() {
      return board;
    });
};

// pocket:new
Interface.prototype.newPocket = function( wallid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getWall( wallid )
    .then(function( wall ) {
      if ( ui && ui.displayPocketCreator( wall ) ) {
        queue.publish( 'pocketcreator.displayed', wallid );
      }
    });
};

// pocket:edit
Interface.prototype.editPocket = function( id ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getPocket( id )
    .then(function( pocket ) {
      if ( ui && ui.displayPocketEditor( pocket ) ) {
        queue.publish( 'pocketeditor.displayed', pocket );
      }

      return pocket;
    });
};

// region:new
Interface.prototype.newRegion = function( boardid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getBoard( boardid )
    .then(function( board ) {
      if ( ui && ui.displayRegionCreator( board ) ) {
        queue.publish( 'regioncreator.displayed', boardid );
      }
    });
};

// region:edit
Interface.prototype.editRegion = function( id ) {
  var interface = this;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegion( id )
    .then(function( region ) {
      if ( ui && ui.displayRegionEditor( region ) ) {
        queue.publish( 'regioneditor.displayed', region );
      }

      return region;
    });
};

// region:created
Interface.prototype.displayRegion = function( id ) {
  var interface = this;
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getRegion( id )
    .then(function( region ) {
      if ( !interface._board || region.getBoard() !== interface._board.getId() || ~interface._regions.indexOf( region.getId() )) {
        return;
      }

      interface._regions.push( region.getId() );

      if ( ui && ui.displayRegion( region ) ) {
        queue.publish( 'region.displayed', region );
      }

      return region;
    });
};

// board:displayed
Interface.prototype.displayRegions = function( board ) {
  var interface = this;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegionsForBoard( board )
    .then(function( regions ) {
      regions.forEach(function( region ) {
        interface.displayRegion( region );
      });

      return regions;
    });
};

Interface.prototype.enableControls = function( board ) {
  if (this._ui && this._ui.enableControls( board ) ) {
    queue.publish( 'controls.enabled' );
  }
};










Interface.prototype.addBoard = function( board ) {
  var queue = this._queue;

  if ( !this._wall || this._wall.getId() !== board.getWall() ) {
    return false;
  }

  if ( this._ui && this._ui.updateBoardSelector( board ) ) {
    queue.publish( 'board.added', board );
  }

  return true;
};

// cardlocations


// cardlocation:created
Interface.prototype.displayCardLocation = function( location ) {
  return callDisplayCardLocationWithPocket( this, location )
    .catch(function( error ) {
      queue.publish( 'cardlocation.display.fail', { message: error.message, stack: error.stack } );
    });
};

// board:displayed
Interface.prototype.displayCardLocations = function( locations ) {
  var interface = this;
  var queries = this._queries;

  var promise = Promise.resolve();

  locations.forEach(function( location ) {
    promise.then(function() {
      return callDisplayCardLocationWithPocket( interface, location );
    });
  });

  return promise
    .catch(function( error ) {
      queue.publish( 'cardlocations.display.fail', { message: error.message, stack: error.stack } );
    });
};

function callDisplayCardLocationWithPocket( interface, location ) {
  var queries = interface._queries;
  var ui = interface._ui;

  var queue = interface._queue;

  return queries.getPocket( location.getPocket() )
    .then(function( pocket ) {
      if ( !interface._board || location.getBoard() !== interface._board.getId() || ~interface._cardlocations.indexOf( location.getId() )) {
        return false;
      }

      interface._cardlocations.push( location.getId() );

      if ( ui && ui.displayCardLocation( location, pocket ) ) {
        queue.publish( 'cardlocation.displayed', location );
      }

      return location;
    });
}






/*
Interface.prototype.displayCardLocation = function( location, pocket ) {


  return true;
};
*/

module.exports = Interface;
