var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

function Interface( queue, repository, ui ) {
  var interface = this;
  var queue = this.queue = queue;
  this.repository = repository;

  this.ui = ui;

  if ( ui ) {
    ui.addListener('wall.select', function() {
      interface.displayWallSelector();
    });

    ui.addListener('wall.create', function( data ) {
      interface.createWall( data );
    });

    ui.addListener('wall.display', function( data ) {
      interface.displayWall( data );
    });

    ui.addListener('wall.edit', function( data ) {
      interface.editWall( data );
    });

    ui.addListener('wall.update', function( data ) {
      interface.updateWall( data );
    });

    ui.addListener('view.new', function( data ) {
      interface.newView( data );
    });

    ui.addListener('view.create', function( data ) {
      interface.createView( data );
    });

    ui.addListener('view.display', function( data ) {
      interface.displayView( data );
    });

    ui.addListener('view.edit', function( data ) {
      interface.editView( data );
    });

    ui.addListener('view.update', function( data ) {
      interface.updateView( data );
    });

    ui.addListener('region.new', function( data ) {
      interface.newRegion( data );
    });

    ui.addListener('region.create', function( data ) {
      interface.createRegion( data );
    });

    ui.addListener('region.display', function( data ) {
      interface.displayRegion( data );
    });

    ui.addListener('region.edit', function( data ) {
      interface.editRegion( data );
    });

    ui.addListener('region.update', function( data ) {
      interface.updateRegion( data );
    });

    ui.addListener('card.new', function( data ) {
      interface.newCard( data );
    });

    ui.addListener('card.create', function( data ) {
      interface.createCard( data );
    });

    ui.addListener('card.display', function( data ) {
      interface.displayCard( data );
    });

    ui.addListener('card.edit', function( data ) {
      interface.editCard( data );
    });

    ui.addListener('card.update', function( data ) {
      interface.updateCard( data );
    });

    ui.addListener('login.auth', function( data ) {
      interface.authLogin( data );
    });

    // these need moving to the appropriate Models and Shapes
/*
    queue.subscribe('wall.created', function( data ) {
      interface.postCreateWall( data );
    });
*/
    queue.subscribe('view.added', function( data ) {
      interface.postCreateView( data );
    });

    queue.subscribe('region.added', function( data ) {
      interface.postCreateRegion( data );
    });

    queue.subscribe('card.added', function( data ) {
      interface.postCreateCard( data );
    });

  }
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

  return repository.createWall( data )
    .catch(function( error ) {
      queue.publish( 'wall.create.fail', error );
    })
    .then(function( wall ) {
      return interface.displayWall( wall.getId() );
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
      return repository.getViews( wall.getViews() );
    })
    .then(function( views ) {
      if ( !views.length ) {
        return interface.newView( wallid );
      }

      return interface.displayView( views[0].getId() );
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
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var view;
  return repository.createView( data )
    .then(function( resource ) {
      view = resource;

      return interface.displayView( view.getId() );
    })
    .then(function() {
      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.create.fail', error );
    });
};

Interface.prototype.postCreateView = function( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var view;
  return repository.getView( data.view )
    .then(function( resource ) {
      view = resource;

      return interface.addView( view.getId() );
    })
    .then(function() {
      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.clone.fail', error );
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
      }

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'viewselector.display.fail', error );
    })
};

Interface.prototype.addView = function( viewid ) {
  var interface = this;
  var repository = this.repository;
  var ui = this.ui;

  return repository.getView( viewid )
    .then(function( view ) {
      if ( ui && interface._wall && interface._wall.getId() === view.getWall() ) {
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

  var view;
  return repository.getView( viewid )
    .then(function( resource ) {
      view = resource;

      return repository.getWall( view.getWall() );
    })
    .then(function( wall ) {
      return repository.getViews( wall.getViews() );
    })
    .then(function( views ) {
      if ( ui ) ui.displayViewEditor( view, views );

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
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var card;
  return repository.createCard( data )
    .catch(function( error ) {
      queue.publish( 'card.create.fail', error );
    });
};

Interface.prototype.postCreateCard = function( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var card;
  return repository.getCard( data.card )
    .then(function( resource ) {
      card = resource;

      return interface.displayCard( card.getId() );
    })
    .then(function() {
      return card;
    })
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

      if ( ui ) ui.displayCard( interface._view, card );

      return card;
    })
    .catch(function( error ) {
      queue.publish( 'card.display.fail', error );
    });
};

Interface.prototype.editCard = function( cardid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getCard( cardid )
    .then(function( card ) {
      if ( ui ) ui.displayCardEditor( card );

      return card;
    })
    .catch(function( error ) {
      queue.publish( 'card.edit.fail', error );
    })
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
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var region;
  return repository.createRegion( data )
    .catch(function( error ) {
      queue.publish( 'region.create.fail', error );
    });
};

Interface.prototype.postCreateRegion = function( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var region;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return interface.displayRegion( region.getId() );
    })
    .then(function() {
      return region;
    })
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

Interface.prototype.editRegion = function( regionid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getRegion( regionid )
    .then(function( region ) {
      if ( ui ) ui.displayRegionEditor( region );

      return region;
    })
    .catch(function( error ) {
      queue.publish( 'region.edit.fail', error );
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

Interface.prototype.authLogin = function( data ) {
  var ui = this.ui;

  if ( ui ) ui.displayLogin();
}

module.exports = Interface;
