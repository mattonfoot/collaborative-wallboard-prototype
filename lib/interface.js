var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

function Interface( queue, queries, ui ) {
  var interface = this;
  this.ui = ui;
  this.queries = queries;
  var queue = this.queue = queue;

  // responses to events

  queue.subscribe( 'wall.created', function() {
  //  interface.displayWall();
  });

  queue.subscribe( 'wall.displayed', function( wall ) {
  //  interface.displayViewSelector( wall );
  });

  queue.subscribe( 'view.created', function( view ) {
  //  interface.displayView( view );
  });

  queue.subscribe( 'view.added', function( info ) {
  //  interface.addView( info );
  });

  queue.subscribe( 'view.displayed', function( view ) {
  //  interface.enableControls( view );

  //  interface.displayRegions( view );

  //  interface.displayCardLocations( view );
  });

  queue.subscribe( 'region.created', function( region ) {
  //  interface.displayRegion( region );
  });

  queue.subscribe( 'cardlocation.created', function( region ) {
  //  interface.displayCardLocation( region );
  });
}

Interface.prototype.newWall = function() {
  var ui = this.ui;

  return new Promise(function( resolve ) {
    if ( ui ) ui.displayWallCreator();

    resolve();
  });
};

Interface.prototype.selectWalls = function() {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getAllWalls()
    .then(function( walls ) {
      if ( ui ) ui.displayWallSelector( walls );

      return walls;
    });
};

Interface.prototype.displayWall = function( wallid ) {
  var interface = this;
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  var wall;
  return queries.getWall( wallid )
    .then(function( resource ) {
      wall = resource;

      interface._wall = wall;
      interface._regions = [];
      interface._cardlocations = [];
      delete interface._view;

      if ( ui ) {
        ui.displayWall( wall );

        var view = wall.getViews()[0];
        if ( view ) {
          return interface.displayView( view );
        }

        return interface.newView( wallid );
      }
    })
    .then(function() {
      return wall;
    });
};

Interface.prototype.editWall = function( wallid ) {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayWallEditor( wall );

      return wall;
    });
};

Interface.prototype.newView = function( wallid ) {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayViewCreator( wall );

      return wall;
    });
};

Interface.prototype.editView = function( viewid ) {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getView( viewid )
    .then(function( view ) {
      if ( ui ) ui.displayViewEditor( view );

      return view;
    });
};

Interface.prototype.newCard = function( wallid ) {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayCardCreator( wall );

      return wall;
    });
};

Interface.prototype.newRegion = function( viewid ) {
  var queries = this.queries;
  var ui = this.ui;

  var queue = this.queue;

  return queries.getView( viewid )
    .then(function( view ) {
      if ( ui ) ui.displayRegionCreator( view );

      return view;
    });
};






/*

// view:edit
Interface.prototype.editView = function( id ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getView( id )
    .then(function( view ) {
      if ( ui && ui.displayViewEditor( view ) ) {
        queue.publish( 'vieweditor.displayed', view );
      }

      return view;
    });
};

Interface.prototype.displayViewSelector = function( wallid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  var wall;
  return queries.getWall( wallid )
    .then(function( resource ) {
      wall = resource;

      return queries.getViewsForWall( wall );
    })
    .then(function( views ) {
      if ( views.length && ui && ui.displayViewSelector( wall, views ) ) {
        queue.publish( 'viewselector.displayed', views ); // TODO: list Ids
      }

      return wall;
    });
};

// view:display
// view:created
Interface.prototype.displayView = function( id ) {
  var interface = this;
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  var view;
  return queries.getView( id )
    .then(function( resource ) {
      view = resource;

      if ( !interface._wall || view.getWall() !== interface._wall.getId() ) {
        return;
      }

      interface._view = view;
      interface._regions = [];
      interface._cardlocations = [];

      if ( ui && ui.displayView( view ) ) {
        queue.publish( 'view.displayed', id );
      }
    })
    .then(function() {
      return view;
    });
};









// pocket:new

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

// view:created
Interface.prototype.displayCardLocations = function( view ) {
  var interface = this;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getCardLocationsForView( view )
    .then(function( locations ) {
      locations.forEach(function( location ) {
        interface.displayCardLocation( location );
      });

      return location;
    });
};

// cardlocation:created
Interface.prototype.displayCardLocation = function( location ) {
  var interface = this;
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getPocket( location.getPocket() )
    .then(function( pocket ) {
      if ( !interface._view || location.getView() !== interface._view.getId() || ~interface._cardlocations.indexOf( location.getId() )) {
        return false;
      }

      interface._cardlocations.push( location.getId() );

      if ( ui && ui.displayCardLocation( location, pocket ) ) {
        queue.publish( 'cardlocation.displayed', location );
      }

      return location;
    })
    .catch(function( error ) {
      queue.publish( 'cardlocation.display.fail', { message: error.message, stack: error.stack } );
    });
};









// region:new
Interface.prototype.newRegion = function( viewid ) {
  var queries = this._queries;
  var ui = this._ui;

  var queue = this._queue;

  return queries.getView( viewid )
    .then(function( view ) {
      if ( ui && ui.displayRegionCreator( view ) ) {
        queue.publish( 'regioncreator.displayed', viewid );
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

// view:displayed
Interface.prototype.displayRegions = function( view ) {
  var interface = this;
  var queries = this._queries;

  var queue = this._queue;

  return queries.getRegionsForView( view )
    .then(function( regions ) {
      regions.forEach(function( region ) {
        interface.displayRegion( region );
      });

      return regions;
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
      if ( !interface._view || region.getView() !== interface._view.getId() || ~interface._regions.indexOf( region.getId() )) {
        return;
      }

      interface._regions.push( region.getId() );

      if ( ui && ui.displayRegion( region ) ) {
        queue.publish( 'region.displayed', region );
      }

      return region;
    });
};










Interface.prototype.addView = function( info ) {
  var ui = this._ui;

  if ( !this._wall || this._wall.getId() !== info.wall ) {
    return false;
  }

  return this._queries.getView( info.view )
    .then(function( view ) {
      if ( ui ) {
        ui.updateViewSelector( view );
      }

      return view;
    });
};

Interface.prototype.enableControls = function( view ) {
  if (this._ui && this._ui.enableControls( view ) ) {
    queue.publish( 'controls.enabled' );
  }
};

*/

module.exports = Interface;
