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

function Application( belt, queue, interface, options ) {
    this.options = options || {};

    this.belt = belt;

    this._listen = true;

    var factories = {
      "Board": Board,
      "CardLocation": CardLocation,
      "Pocket": Pocket,
      "Region": Region,
      "Transform": Transform,
      "Wall": Wall
    };

    for ( var key in factories ) {
        var type = key.toLowerCase(), Model = factories[ key ];

        // register model
        belt.resource( type, Model.factory( queue ) )
            .schema( Model.schema )
            .validator( Model.validator )
            .beforeCreate( Model.onBeforeCreate )
            .beforeUpdate( Model.onBeforeUpdate );
    }

    // initialize the services
    var commands = this.commands = new Commands( belt, queue );
    var queries = this.queries = new Queries( belt, queue );

    var services = this.services = new Services( interface, commands, queries, queue );
    var movementTracker = this.movementTracker = new MovementTracker( queue, queries );
    var transformManager = this.transformManager = new TransformManager( queue, queries );

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
                  promise
                    .catch(function( error ) {
                      queue.publish( type.toLowerCase() + ':' + task + ':fail', error );
                    });
                }
            });
        });
    }

    // setup events to handle additional actions
/*
    queue.on('board:displayed', function( board ) {
        if (!_this._listen) return;

        console.log( '!!!!!!!!!! board:displayed' );

        services.displayCardLocations( board )
          .catch(function( error ) {
            queue.publish( 'board:displayed:fail', error );
          });
        services.displayRegions( board )
          .catch(function( error ) {
            queue.publish( 'board:displayed:fail', error );
          });
    });
*/

    queue.on( 'pocket:transformed', function( data ) {
        if (!_this._listen) return;

        commands.updatePocket( data )
          .catch(function( error ) {
            queue.publish( 'pocket:transformed:fail', error );
          });
    });
}

Application.prototype.pauseListening = function() {
    this._listen = false;
};

Application.prototype.startListening = function() {
    this._listen = true;
};

module.exports = Application;
