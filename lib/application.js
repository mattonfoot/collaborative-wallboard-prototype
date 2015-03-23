var Board = require('../lib/models/board')
  , CardLocation = require('../lib/models/cardlocation')
  , Pocket = require('../lib/models/pocket')
  , Region = require('../lib/models/region')
  , Transform = require('../lib/models/transform')
  , Wall = require('../lib/models/wall')

//  system
  , Commands = require('../lib/commands')
  , Queries = require('../lib/queries')
  , Services = require('../lib/services')
  , MovementTracker = require('../lib/trackMovement')
  , TransformManager = require('../lib/transformManager');

function Application( belt, queue, ui, options ) {
    this.options = options || {};

    this.belt = belt;

    this._listen = true;

    var factories = {
        "Board": Board
      , "CardLocation": CardLocation
      , "Pocket": Pocket
      , "Region": Region
      , "Transform": Transform
      , "Wall": Wall
    };

    for ( var key in factories ) {
        var type = key.toLowerCase(), Model = factories[ key ];

        // register model
        belt.resource( type, Model.constructor )
            .schema( Model.schema )
            .validator( Model.validator )
            .beforeCreate( Model.onBeforeCreate )
            .beforeUpdate( Model.onBeforeUpdate );

        // listen to db for events
        // attachListenersToDb( type );
    }

    // initialize the services
    var commands = this.commands = new Commands( belt, queue, factories );
    var queries = this.queries = new Queries( belt );

    var services = this.services = new Services( ui, commands, queries );
    var movementTracker = this.movementTracker = new MovementTracker( queue, commands, queries );
    var transformManager = this.transformManager = new TransformManager( queue, commands, queries );
/*
    var listeners = [ 'created', 'creating', 'updated', 'updating', 'deleted', 'deleting' ];

    function attachListenersToDb( type  ) {
        listeners.forEach(function( listener ) {
            belt.on( type + ':' + listener, function( data ) {
                queue.trigger( type + ':' + listener, data );
            });
        });
    }
*/
    this.constructor = Application;

    var _this = this;

    // setup events to trigger services

    var listeners2 = [ 'new', 'create', 'edit', 'update', 'select', 'display', 'unlink', 'move', 'resize' ];

    for ( var x in factories ) {
        setUpEventListeners( x );
    }

    function setUpEventListeners( type ) {
        listeners2.forEach(function( task ) {
            queue.on( type.toLowerCase() + ':' + task, function( ev ) {
                if (!_this._listen || !services[ task + type ]) return;

                if (options.debug) {
                    console.log( 'services.' + task + type + '()' );
                }

                var promise = services[ task + type ]( ev );

                if ( promise && promise.catch ) {
                  promise.catch(function( error ) {
                      console.error( error );
                  });
                }
            });
        });
    }

    queue

        .on('wall:created', function( wall ) {
            if (!_this._listen) return;

            services.displayWall( wall.getId() )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on('board:created', function( board ) {
            if (!_this._listen) return;

            services.displayBoard( board.getId() )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on('region:created', function( region ) {
            if (!_this._listen) return;

            services.displayRegion( region.getId() )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on('cardlocation:created', function( cardlocation ) {
            if (!_this._listen) return;

            services.displayCardLocation( cardlocation )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on( 'cardlocation:updated', function( location ) {
            if (!_this._listen) return;

            movementTracker.trackCardMovement( location );
        })

        .on( 'region:updated', function( region ) {
            if (!_this._listen) return;

            movementTracker.trackRegionMovement( region )
        })

        .on('board:displayed', function( board ) {
            if (!_this._listen) return;

            services.displayCardLocations( board )
              .catch(function( error ) {
                  console.error( error );
              });
            services.displayRegions( board )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on('wall:firsttime', function( wall ) {
            if (!_this._listen) return;

            services.newBoard();
        })

        .on( 'pocket:regionenter', function( data ) {
            if (!_this._listen) return;

            transformManager.checkTransforms( data )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        .on( 'pocket:regionexit', function( data ) {
            if (!_this._listen) return;

            transformManager.checkTransforms( data )
              .catch(function( error ) {
                  console.error( error );
              });
        })

        ;
}

Application.prototype.pauseListening = function() {
    this._listen = false;
};

Application.prototype.startListening = function() {
    this._listen = true;
};

module.exports = Application;
