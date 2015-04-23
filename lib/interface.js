var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ /* 'CardLocation', 'Transform', */ 'Wall', 'Board', 'Pocket', 'Region' ];
var topics = [ 'new', 'edit' ];

function Interface( queue, queries, ui ) {
  var interface = this;
  this._ui = ui;
  this._queries = queries;
  var queue = this._queue = queue;

  // setup events to trigger services
  models.forEach(function( model ) {
    setUpEventListeners( interface, queue, model );
  });

  // responses to events

  queue.subscribe( 'board.created', function( board ) {
    interface.addBoard( board );
  });

  queue.subscribe( 'board.displayed', function( board ) {
    interface.enableControls( board );
  });

  queue.subscribe( 'wall.displayed', function( wall ) {
    interface.displayBoardSelector( wall );
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
      if ( this._ui && this._ui.displayBoardEditor( board ) ) {
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
      if ( interface.displayRegionEditor( region ) ) {
        queue.publish( 'regioneditor.displayed', region );
      }

      return region;
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

Interface.prototype.displayBoard = function( board ) {
  if ( !this._wall || board.getWall() !== this._wall.getId() ) {
    return false;
  }

  this._board = board;
  this._regions = [];
  this._cardlocations = [];

  if ( this._ui ) {
    this._ui.displayBoard( board );
  }

  return true;
};

// cardlocations

Interface.prototype.displayCardLocation = function( location, pocket ) {
  if ( !this._board || location.getBoard() !== this._board.getId() || ~this._cardlocations.indexOf( location.getId() )) {
    return false;
  }

  this._cardlocations.push( location.getId() );

  if ( this._ui ) this._ui.displayCardLocation( location, pocket );

  return true;
};

// regions

Interface.prototype.displayRegion = function( region ) {
  if ( !this._board || region.getBoard() !== this._board.getId() || ~this._regions.indexOf( region.getId() )) return false;

  this._regions.push( region.getId() );

  if (this._ui) this._ui.displayRegion( region );

  return true;
};

Interface.prototype.displayRegions = function( regions ) {
  var interface = this;

  var successful = true;
  regions.forEach(function( region ) {
    if ( !interface.displayRegion( region ) ) {
      successful = false;
    }
  });

  return successful;
};

Interface.prototype.displayRegionEditor = function( region ) {
  if (this._ui) this._ui.displayRegionEditor( region );

  return true;
};

// walls

Interface.prototype.displayWall = function( wall ) {
  this._wall = wall;
  this._regions = [];
  this._cardlocations = [];
  delete this._board;

  if (this._ui) this._ui.displayWall( wall );

  return true;
};

module.exports = Interface;
