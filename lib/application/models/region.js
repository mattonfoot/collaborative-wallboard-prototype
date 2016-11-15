var uuid = require('uuid');

const addBoundSubcription = ( l, x ) => ( e, h ) => l.subscribe( e, h.bind( x ) );

const attachRegionEvents = (region) => {
  var addQueueSubscription = addBoundSubcription( region.queue, region );

  addQueueSubscription( 'region.updated', Region.prototype.updated );
  addQueueSubscription( 'region.moved', Region.prototype.moved );
  addQueueSubscription( 'region.resized', Region.prototype.resized );
  addQueueSubscription( 'card.regionentered', Region.prototype.cardEntered );
  addQueueSubscription( 'card.regionexited', Region.prototype.cardExited );

  return region;
};

const initializeWithData = ( region, data ) => {
  region.id = data.region;
  region.view = data.view;

  if ( data.label ) {
    region.label = data.label;
  }
  if ( data.value ) {
    region.value = data.value;
  }
  if ( data.color ) {
    region.color = data.color;
  }

  region.width = data.width;
  region.height = data.height;
  region.x = data.x;
  region.y = data.y;
};

function Region( data, queue ) {
  if ( !data.view || data.view === '' ) {
    throw new Error( 'View is required' );
  }

  if ( !data.label || data.label === '' ) {
    throw new Error( 'Label is required' );
  }

  initializeWithData( this, data );

  this.cards = [];

  this.constructor = Region;
  this.queue = queue;

  return attachRegionEvents( this );
}

Region.constructor = function( data, queue ) {
  var create = {
    region: uuid.v4(),
    view: data.view,
    label: data.label,
    width: data.width || 200,
    height: data.height || 200,
    x: data.x || 10,
    y: data.y || 10
  };

  if ( data.value ) {
    create.value = data.value;
  }
  if ( data.color ) {
    create.color = data.color;
  }

  var region = new Region( create, queue );

  queue.publish( 'region.created', create );

  return region;
};

Region.eventsource = function( queue, events ) {
  var region;

  events.forEach(function( event ) {
    if ( !region ) {
      if ( event.topic === 'region.created' ) {
        region = new Region( event.data, queue );

        return;
      }

      throw new Error( 'No created event found for resource' );
    }

    if ( event.topic !== 'region.created' ) {
      switch ( event.topic ) {
        case 'region.updated':
          region.updated( event.data );
          break;
        case 'region.moved':
          region.moved( event.data );
          break;
        case 'region.resized':
          region.resized( event.data );
          break;
        case 'card.regionentered':
          region.cardEntered( event.data );
          break;
        case 'card.regionexited':
          region.cardExited( event.data );
          break;
      }

      return;
    }

    throw new Error( 'Created event encountered for resource that was already created' );
  });

  return region;
};

Region.prototype.getId = function() {
    return this.id;
};

Region.prototype.getProperty = function( prop ) {
  return this[ prop ];
};

Region.prototype.getLabel = function() {
    return this.label;
};

Region.prototype.getValue = function() {
    return this.value;
};

Region.prototype.getColor = function() {
    return this.color;
};

Region.prototype.update = function( data ) {
  if ( data.region && data.region !== this.getId() ) {
    return;
  }

  var update = {
    region: this.getId(),
    label: data.label,
    value: data.value,
    color: data.color
  };

  var errors = this.updated( update );

  if ( errors ) {
    return errors;
  }

  this.queue.publish( 'region.updated', update );
};

Region.prototype.updated = function( data ) {
  if ( data.region === this.getId() ) {
    if ( data.label ) {
      this.label = data.label;
    }
    if ( data.value ) {
      this.value = data.value;
    }
    if ( data.color ) {
      this.color = data.color;
    }
  }
};

Region.prototype.getView = function() {
    return this.view;
};

Region.prototype.getPosition = function() {
  return {
    x: this.x,
    y: this.y
  };
};

Region.prototype.move = function( data ) {
  if ( data.region && data.region !== this.getId() ) {
    return;
  }

  var update = {
    region: this.getId(),
    x: data.x,
    y: data.y
  };

  var errors = this.moved( update );

  if ( errors ) {
    return errors;
  }

  this.queue.publish( 'region.moved', update );
};

Region.prototype.moved = function( data ) {
  if ( data.region === this.getId() && ( this.x !== data.x || this.y !== data.y ) ) {
    this.x = data.x;
    this.y = data.y;
  }
};

Region.prototype.getSize = function() {
  return {
    width: this.width,
    height: this.height
  };
};

Region.prototype.resize = function( data ) {
  if ( data.region && data.region !== this.getId() ) {
    return;
  }

  var update = {
    region: this.getId(),
    width: data.width,
    height: data.height
  };

  var errors = this.resized( update );

  if ( errors ) {
    return errors;
  }

  this.queue.publish( 'region.resized', update );
};

Region.prototype.resized = function( data ) {
  if ( data.region === this.getId() && ( this.width !== data.width || this.height !== data.height ) ) {
    this.width = data.width;
    this.height = data.height;
  }
};

Region.prototype.getCards = function() {
    return this.cards;
};

Region.prototype.cardEntered = function( data ) {
  if ( data.region && data.region !== this.getId() ) {
    return;
  }

  if ( data.card && !~this.cards.indexOf( data.card ) ) {
    this.cards.push( data.card );

    return true;
  }
};

Region.prototype.cardExited = function( data ) {
  if ( data.region && data.region !== this.getId() ) {
    return;
  }

  if ( !data.card ) {
    return;
  }

  var loc = this.cards.indexOf( data.card );

  if ( ~loc ) {
    this.cards.splice( loc, 1 );

    return true;
  }
};

module.exports = Region;
