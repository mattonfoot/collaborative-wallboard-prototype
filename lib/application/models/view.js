var uuid = require('uuid');

function View( data, queue ) {
  if ( !data.wall || data.wall === '' ) {
    throw new Error( 'Wall is required' );
  }

  if ( !data.name || data.name === '' ) {
    throw new Error( 'Name is required' );
  }

  this.id = data.view;
  this.wall = data.wall;
  this.name = data.name;

  this.constructor = View;
  this.queue = queue;
}

View.constructor = function( data, queue ) {
  var create = {
    view: uuid.v4(),
    wall: data.wall,
    name: data.name
  }

  var view = new View( create, queue );

  queue.publish( 'view.created', create );

  return view;
};

View.eventsource = function( queue, events ) {
  var view;
  events.forEach(function( event ) {
    if ( !view ) {
      if ( event.topic === 'view.created' ) {
        view = new View( event.data, queue );

        return;
      }

      throw new Error( 'No created event found for resource' );
    }

    if ( event.topic !== 'view.created' ) {
      switch( event.topic ) {
        case 'view.updated':
          wall.updated( event.data );
          break;
      }

      return;
    }

    throw new Error( 'Created event encountered for resource that was already created' );
  });

  return view;
};

View.prototype.getId = function() {
    return this.id;
};

View.prototype.getName = function() {
    return this.name;
};

View.prototype.update = function( data ) {
  if ( data.view && data.view !== this.getId() ) return;

  var update = {
    view: this.getId(),
    name: data.name
  };

  var errors = this.updated( update );

  if ( errors ) return errors;

  this.queue.publish( 'view.updated', update );
};

View.prototype.updated = function( data ) {
  if ( data.view === this.getId() && this.getName() != data.name ) {
    this.name = data.name;
  }
};

View.prototype.getWall = function() {
    return this.wall;
};

module.exports = View;
