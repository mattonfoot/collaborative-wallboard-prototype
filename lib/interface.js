var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

function Interface( queue, repository, ui ) {
  var interface = this;
  var queue = this.queue = queue;
  this.repository = repository;
  this.ui = ui;

  // responses to events

  queue.subscribe( 'wall.created', function( data ) {
  //  interface.displayWall( data.wall );
  });

  queue.subscribe( 'view.created', function( data ) {
  //  interface.addView( data.view );

  //  interface.displayView( data.view );
  });

  queue.subscribe( 'region.created', function( data ) {
  //  interface.displayRegion( data.region );
  });

  queue.subscribe( 'card.created', function( data ) {
  //  interface.displayCard( data.card );
  });
}

Interface.prototype.newWall = function() {
  var ui = this.ui;

  return new Promise(function( resolve ) {
    if ( ui ) ui.displayWallCreator();

    resolve();
  })
  .catch(function( error ) {
    queue.publish( 'wall.new.fail', error );
  })
};

Interface.prototype.createWall = function( data ) {
  var interface = this;
  var repository = this.repository;

  var queue = this.queue;

  var wall;
  return repository.createWall( data )
    .catch(function( error ) {
      queue.publish( 'wall.create.fail', error );
    });
};

Interface.prototype.displayWallSelector = function() {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getAllWalls()
    .then(function( walls ) {
      if ( ui ) ui.displayWallSelector( walls );

      return walls;
    })
    .catch(function( error ) {
      queue.publish( 'wallselector.display.fail', error );
    })
};

Interface.prototype.displayWall = function( wallid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  var wall;
  return repository.getWall( wallid )
    .then(function( resource ) {
      wall = resource;

      interface._wall = wall;
      interface._regions = [];
      interface._cards = [];

      delete interface._view;

      if ( ui ) {
        ui.displayWall( wall );

        return interface.displayViewSelector( wall.getId() );
      }
    })
    .then(function() {
      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'wall.display.fail', error );
    })
};

Interface.prototype.editWall = function( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayWallEditor( wall );

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'wall.edit.fail', error );
    })
};

Interface.prototype.updateWall = function( data ) {
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

Interface.prototype.newView = function( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayViewCreator( wall );

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'view.new.fail', error );
    })
};

Interface.prototype.createView = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createView( data )
    .catch(function( error ) {
      queue.publish( 'view.create.fail', error );
    });
};

Interface.prototype.displayViewSelector = function( wallid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  var wall;
  return repository.getWall( wallid )
    .then(function( resource ) {
      wall = resource;

      return repository.getViews( wall.getViews() );
    })
    .then(function( views ) {
      if ( ui ) {
        ui.displayViewSelector( wall, views );

        if ( !views.length ) {
          return interface.newView( wallid );
        }

        return interface.displayView( views[0].getId() );
      }
    })
    .then(function() {
      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'viewselector.display.fail', error );
    })
};

Interface.prototype.addView = function( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  return repository.getView( viewid )
    .then(function( view ) {
      if ( ui && this._wall && this._wall.getId() !== view.getWall() ) {
        ui.updateViewSelector( view );
      }

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.add.fail', error );
    })
};

Interface.prototype.displayView = function( viewid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  var view;
  return repository.getView( viewid )
    .then(function( resource ) {
      view = resource;

      if ( !interface._wall || view.getWall() !== interface._wall.getId() ) {
        return;
      }

      interface._regions = [];
      interface._cards = [];

      interface._view = view;

      if ( ui) {
        ui.displayView( view );

        ui.enableControls( view );

        var promises = [];
        promises.push( interface.displayRegions( view ) );
        promises.push( interface.displayCards( view ) );

        return RSVP.all( promises );
      }
    })
    .then(function() {
      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.display.fail', error );
    })
};

Interface.prototype.editView = function( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getView( viewid )
    .then(function( view ) {
      if ( ui ) ui.displayViewEditor( view );

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.edit.fail', error );
    })
};

Interface.prototype.updateView = function( data ) {
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

Interface.prototype.newCard = function( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) ui.displayCardCreator( wall );

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'card.new.fail', error );
    });
};

Interface.prototype.createCard = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createCard( data )
    .catch(function( error ) {
      queue.publish( 'card.create.fail', error );
    });
};

Interface.prototype.displayCards = function( view ) {
  var interface = this;
  var repository = this.repository;

  var queue = this.queue;

  return repository.getWall( view.getWall() )
    .then(function( wall ) {
      var ids = wall.getCards()

      var promises = ids.map(function( id ) {
        return interface.displayCard( id );
      });

      return RSVP.all( promises );
    })
    .catch(function( error ) {
      queue.publish( 'cards.display.fail', error );
    });
};

Interface.prototype.displayCard = function( cardid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getCard( cardid )
    .then(function( card ) {
      if ( !interface._view || card.getWall() !== interface._wall.getId() || ~interface._cards.indexOf( card.getId() )) {
        return false;
      }

      interface._cards.push( card.getId() );

      if ( ui ) ui.displayCard( card );

      return location;
    })
    .catch(function( error ) {
      queue.publish( 'card.display.fail', error );
    });
};

Interface.prototype.updateCard = function( data ) {
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

Interface.prototype.newRegion = function( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getView( viewid )
    .then(function( view ) {
      if ( ui ) ui.displayRegionCreator( view );

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'region.new.fail', error );
    })
};

Interface.prototype.createRegion = function( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.createRegion( data )
    .catch(function( error ) {
      queue.publish( 'region.create.fail', error );
    });
};

Interface.prototype.displayRegions = function( view ) {
  var interface = this;
  var repository = this.repository;

  var queue = this.queue;

  return repository.getWall( view.getWall() )
    .then(function( wall ) {
      var ids = wall.getRegions( view.getId() );

      var promises = ids.map(function( id ) {
        return interface.displayRegion( id );
      });

      return RSVP.all( promises );
    })
    .catch(function( error ) {
      queue.publish( 'regions.display.fail', error );
    })
};

Interface.prototype.displayRegion = function( regionid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getRegion( regionid )
    .then(function( region ) {
      if ( !interface._view || region.getView() !== interface._view.getId() || ~interface._regions.indexOf( region.getId() )) {
        return;
      }

      interface._regions.push( region.getId() );

      if ( ui && ui.displayRegion( region ) ) {
        queue.publish( 'region.displayed', region );
      }

      return region;
    })
    .catch(function( error ) {
      queue.publish( 'region.display.fail', error );
    })
};

Interface.prototype.updateRegion = function( data ) {
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

module.exports = Interface;
