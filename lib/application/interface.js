function addBoundListener( l, x ) {
  return function( e, h ) { return l.addListener( e, h.bind( x ) ); };
}

function addBoundSubcription( l, x ) {
  return function( e, h ) { return l.subscribe( e, h.bind( x ) ); };
}



function Interface( queue, repository, ui ) {
  this.queue = queue;
  this.repository = repository;
  this.ui = ui;

  this.attachInterfaceEvents();
}

Interface.prototype.attachInterfaceEvents = function attachInterfaceEvents() {
  if ( !this.ui ) {
    return;
  }

  var addUIListener = addBoundListener( this.ui, this );
  var addQueueSubscription = addBoundSubcription( this.queue, this );

  addUIListener( 'wall.select',     this.displayWallSelector );
  addUIListener( 'wall.create',     this.createWall );
  addUIListener( 'wall.display',    this.displayWall );
  addUIListener( 'wall.edit',       this.editWall );
  addUIListener( 'wall.update',     this.updateWall );

  addUIListener( 'view.new',        this.newView );
  addUIListener( 'view.create',     this.createView );
  addUIListener( 'view.display',    this.displayView );
  addUIListener( 'view.edit',       this.editView );
  addUIListener( 'view.update',     this.updateView );
  addQueueSubscription( 'view.added',   this.postCreateView );

  addUIListener( 'region.new',      this.newRegion );
  addUIListener( 'region.create',   this.createRegion );
  addUIListener( 'region.display',  this.displayRegion );
  addUIListener( 'region.edit',     this.editRegion );
  addUIListener( 'region.update',   this.updateRegion );
  addQueueSubscription( 'region.added', this.postCreateRegion );

  addUIListener( 'card.new',          this.newCard );
  addUIListener( 'card.create',       this.createCard );
  addUIListener( 'card.display',      this.displayCard );
  addUIListener( 'card.edit',         this.editCard );
  addUIListener( 'card.update',       this.updateCard );
  addQueueSubscription( 'card.added',   this.postCreateCard );

  addUIListener( 'transform.new',     this.newTransform );
  addUIListener( 'transform.create',  this.createTransform );
  addUIListener( 'transform.edit',    this.editTransform );
  addUIListener( 'transform.update',  this.updateTransform );

  addUIListener( 'login.auth',        this.authLogin );
};

Interface.prototype.newWall = function newWall() {
  var ui = this.ui;

  return new Promise(function( resolve ) {
    if ( ui ) {
      ui.displayWallCreator();
    }

    resolve();
  })
  .catch(function( error ) {
    queue.publish( 'wall.new.fail', error );
  });
};

Interface.prototype.createWall = function createWall( data ) {
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

Interface.prototype.displayWallSelector = function displayWallSelector() {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getAllWalls()
    .then(function( walls ) {
      if ( ui ) {
        ui.displayWallSelector( walls );
      }

      return walls;
    })
    .catch(function( error ) {
      queue.publish( 'wallselector.display.fail', error );
    });
};

Interface.prototype.displayWall = function displayWall( wallid ) {
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
    });
};

Interface.prototype.editWall = function editWall( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) {
        ui.displayWallEditor( wall );
      }

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'wall.edit.fail', error );
    });
};

Interface.prototype.updateWall = function updateWall( data ) {
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

Interface.prototype.newView = function newView( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) {
        ui.displayViewCreator( wall );
      }

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'view.new.fail', error );
    });
};

Interface.prototype.createView = function createView( data ) {
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

Interface.prototype.postCreateView = function postCreateView( data ) {
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

Interface.prototype.displayViewSelector = function displayViewSelector( wallid ) {
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
    });
};

Interface.prototype.addView = function addView( viewid ) {
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
    });
};

Interface.prototype.displayView = function displayView( viewid ) {
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

        return Promise.all( promises );
      }
    })
    .then(function() {
      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.display.fail', error );
    });
};

Interface.prototype.editView = function editView( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  var view;
  return repository.getView( viewid )
    .then(function( resource ) {
      view = resource;

      return repository.getTransforms( view.getTransforms() );
    })
    .then(function( transforms ) {
      if ( ui ) {
        ui.displayViewEditor( view, transforms );
      }

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'view.edit.fail', error );
    });
};

Interface.prototype.updateView = function updateView( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  return repository.getView( data.view )
    .then(function( resource ) {
      resource.update( data );

      return resource;
    })
    .then(function( view ) {
      return interface.displayViewSelector( view.getWall() );
    })
    .catch(function( error ) {
      queue.publish( 'view.update.fail', error );
    });
};

Interface.prototype.newCard = function newCard( wallid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getWall( wallid )
    .then(function( wall ) {
      if ( ui ) {
        ui.displayCardCreator( wall );
      }

      return wall;
    })
    .catch(function( error ) {
      queue.publish( 'card.new.fail', error );
    });
};

Interface.prototype.createCard = function createCard( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var card;
  return repository.createCard( data )
    .catch(function( error ) {
      queue.publish( 'card.create.fail', error );
    });
};

Interface.prototype.postCreateCard = function postCreateCard( data ) {
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

Interface.prototype.displayCards = function displayCards( view ) {
  var interface = this;
  var repository = this.repository;

  var queue = this.queue;

  return repository.getWall( view.getWall() )
    .then(function( wall ) {
      var ids = wall.getCards();

      var promises = ids.map(function( id ) {
        return interface.displayCard( id );
      });

      return Promise.all( promises );
    })
    .catch(function( error ) {
      queue.publish( 'cards.display.fail', error );
    });
};

Interface.prototype.displayCard = function displayCard( cardid ) {
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

      if ( ui ) {
        ui.displayCard( interface._view, card );
      }

      return card;
    })
    .catch(function( error ) {
      queue.publish( 'card.display.fail', error );
    });
};

Interface.prototype.editCard = function editCard( cardid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getCard( cardid )
    .then(function( card ) {
      if ( ui ) {
        ui.displayCardEditor( card );
      }

      return card;
    })
    .catch(function( error ) {
      queue.publish( 'card.edit.fail', error );
    });
};

Interface.prototype.updateCard = function updateCard( data ) {
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

Interface.prototype.newTransform = function newTransform( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  var view;
  return repository.getView( viewid )
    .then(function( resource ){
      view = resource;

      return repository.getWall( view.getWall() );
    })
    .then(function( wall ) {
      return repository.getViews( wall.getViews() );
    })
    .then(function( views ) {
      if ( ui ) {
        ui.displayTransformCreator( view, views );
      }

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'transform.new.fail', error );
    });
};

Interface.prototype.createTransform = function createTransform( form ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var data = {
    view: form.view
  };

  data.phrase = [ 'get ', form.rules_attr,
                  ' from ', form.rules_from_attr, ' of ', form.rules_from_node, ' on view #', form.rules_from_selector,
                  ' when ', form.rules_when_relationship, ' ', form.rules_when_node ].join( '' );

  var card;
  return repository.createTransform( data )
    .catch(function( error ) {
      queue.publish( 'transform.create.fail', error );
    });
};

Interface.prototype.editTransform = function editTransform( transformid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getTransform( transformid )
    .then(function( transform ) {
      if ( ui ) {
        ui.displayTransfromEditor( transform );
      }

      return transform;
    })
    .catch(function( error ) {
      queue.publish( 'transform.edit.fail', error );
    });
};

Interface.prototype.updateTransform = function updateTransform( data ) {
  var repository = this.repository;
  var queue = this.queue;

  return repository.getTransform( data.transform )
    .then(function( transform ) {
      transform.update( data );

      return transform;
    })
    .catch(function( error ) {
      queue.publish( 'transform.update.fail', error );
    });
};

Interface.prototype.newRegion = function newRegion( viewid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getView( viewid )
    .then(function( view ) {
      if ( ui ) {
        ui.displayRegionCreator( view );
      }

      return view;
    })
    .catch(function( error ) {
      queue.publish( 'region.new.fail', error );
    });
};

Interface.prototype.createRegion = function createRegion( data ) {
  var interface = this;
  var repository = this.repository;
  var queue = this.queue;

  var region;
  return repository.createRegion( data )
    .catch(function( error ) {
      queue.publish( 'region.create.fail', error );
    });
};

Interface.prototype.postCreateRegion = function postCreateRegion( data ) {
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

Interface.prototype.displayRegions = function displayRegions( view ) {
  var interface = this;
  var repository = this.repository;

  var queue = this.queue;

  return repository.getWall( view.getWall() )
    .then(function( wall ) {
      var ids = wall.getRegions( view.getId() );

      var promises = ids.map(function( id ) {
        return interface.displayRegion( id );
      });

      return Promise.all( promises );
    })
    .catch(function( error ) {
      queue.publish( 'regions.display.fail', error );
    });
};

Interface.prototype.displayRegion = function displayRegion( regionid ) {
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
    });
};

Interface.prototype.editRegion = function editRegion( regionid ) {
  var repository = this.repository;
  var ui = this.ui;

  var queue = this.queue;

  return repository.getRegion( regionid )
    .then(function( region ) {
      if ( ui ) {
        ui.displayRegionEditor( region );
      }

      return region;
    })
    .catch(function( error ) {
      queue.publish( 'region.edit.fail', error );
    });
};

Interface.prototype.updateRegion = function updateRegion( data ) {
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

Interface.prototype.authLogin = function authLogin( data ) {
  var ui = this.ui;

  if ( ui ) {
    ui.displayLogin();
  }
};

module.exports = Interface;
