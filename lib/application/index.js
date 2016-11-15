var Repository = require('./repository');
var Interface = require('./interface');
var MovementTracker = require('./trackMovement');
var TransformManager = require('./transformManager');

function Application( queue, ui, options ) {
    this.options = options || {};

    // initialize the services
    this.repository = new Repository( queue );    // event sourced objects

    this.interface = new Interface( queue, this.repository, ui );
    this.movementTracker = new MovementTracker( queue, this.repository );
    this.transformManager = new TransformManager( queue, this.repository );

    this.constructor = Application;
}

module.exports = Application;
