var RSVP = require('rsvp')
  , Promise = RSVP.Promise;

function Interface( queue, repository ) {
  var interface = this;
  this.queue = queue;
  this.repository = repository;
}

// public

// wall

// board

// card

// region

module.exports = Interface;
