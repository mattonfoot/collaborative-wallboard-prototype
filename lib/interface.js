var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var models = [ 'Board', 'CardLocation', 'Pocket', 'Region', 'Transform', 'Wall' ];
var topics = [];

function Interface( queue, queries, ui ) {
  var interface = this;
  this._ui = ui;
  this._queries = queries;
  var queue = this._queue = queue;

  // setup events to trigger services
  models.forEach(function( model ) {
    setUpEventListeners( interface, queue, model );
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

Interface.prototype.addBoard = function( board ) {
  if ( !this._wall || this._wall.getId() !== board.getWall() ) {
    return false;
  }

  if ( this._ui ) {
    this._ui.updateBoardSelector( board );
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

Interface.prototype.displayBoardCreator = function() {
  if ( !this._wall ) return false;

  if ( this._ui ) this._ui.displayBoardCreator( this._wall );

  return true;
};

Interface.prototype.displayBoardEditor = function( board ) {
  if ( this._ui) this._ui.displayBoardEditor( board );

  return true;
};

Interface.prototype.displayBoardSelector = function( boards ) {
  if (this._ui) this._ui.displayBoardSelector( this._wall, boards );

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

Interface.prototype.displayPocketCreator = function() {
  if ( !this._wall ) return false;

  if ( this._ui ) this._ui.displayPocketCreator( this._wall );

  return true;
};

Interface.prototype.displayPocketEditor = function( pocket ) {
  if (this._ui) this._ui.displayPocketEditor( pocket );

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

Interface.prototype.displayRegionCreator = function() {
  if ( !this._board ) return false;

  if (this._ui) this._ui.displayRegionCreator( this._board );

  return true;
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

Interface.prototype.displayWallCreator = function() {
  if (this._ui) this._ui.displayWallCreator();

  return true;
};

Interface.prototype.displayWallEditor = function( wall ) {
  if (this._ui) this._ui.displayWallEditor( wall );

  return true;
};

Interface.prototype.displayWallSelector = function( walls ) {
  if (this._ui) this._ui.displayWallSelector( walls );

  return true;
};

Interface.prototype.enableControls = function( data ) {
  if (this._ui) this._ui.enableControls( data );

  return true;
};

module.exports = Interface;
