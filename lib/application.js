var Repository = require('../lib/queries'),
    Interface = require('../lib/interface'),
    Services = require('../lib/services'),
    MovementTracker = require('../lib/trackMovement'),
    TransformManager = require('../lib/transformManager');

function Application( belt, queue, ui, options ) {
    this.options = options || {};

/*
    this.belt = belt;

    var factories = {
      "Wall": Wall,
      "Board": Board,
      "Region": Region,
      "Card": Card
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
*/

    // initialize the services
    var repository = this.repository = new Repository( queue );    // event sourced objects

    var interface = this.interface = new Interface( queue, repository, ui );
    var services = this.services = new Services( queue, repository, interface );
    var movementTracker = this.movementTracker = new MovementTracker( queue, repository );
    var transformManager = this.transformManager = new TransformManager( queue, repository );

    this.constructor = Application;

    var _this = this;
}

module.exports = Application;
