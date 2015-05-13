var Repository = require('./queries'),
    Interface = require('./interface'),
    MovementTracker = require('./trackMovement'),
    TransformManager = require('./transformManager');

function Application( db, queue, ui, options ) {
    this.options = options || {};

    // initialize the services
    var repository = this.repository = new Repository( queue );    // event sourced objects

    var interface = this.interface = new Interface( queue, repository, ui );
    var movementTracker = this.movementTracker = new MovementTracker( queue, repository );
    var transformManager = this.transformManager = new TransformManager( queue, repository );

    this.constructor = Application;

    var _this = this;
}

module.exports = Application;
