var Card = (function() {

// defaults
var counter = 0;

// constructor

function Card( queue, socket, config ) {
  var card = this;
  
  card.id = config.cardid || 'card_' + (++counter);
  card.pocketid = config.pocketid;
  card.title = config.title;  
  card.shape = config.shape;
  card.color;
  
  __watch.call( card, queue, socket, card.shape );
  
  // public methods
  
  card.moveTo = function( x, y ) {
    return __moveTo.call( card, queue, socket, card.shape, x, y, true );
  };
  
  card.addTag = function( color ) {
    return __addTag.call( card, queue, socket, card.shape, color, true );
  };
  
  card.removeTag = function() {
    return __removeTag.call( card, queue, socket, card.shape, true );
  };
  
  return card;
}

// private methods

function __getCoordinates() {
  return { 
    cardid: this.id,
    pocketid: this.pocketid,
    color: this.color,
    x: this.shape.getX(), 
    y: this.shape.getY()
  }
}

function __watch( queue, socket, shape ) {
  var card = this;

  shape
    .on('mousedown touchstart', function() {
      if (card.active) {
        this.displayActiveState();
        
        __broadcastEvent.call( card, queue, 'active', socket, 'active' );
      }
    })
    .on('mouseup touchend', function() {
      if (card.active) {
        this.displayInactiveState();
        
        __broadcastEvent.call( card, queue, 'inactive', socket, 'inactive' );
      }
    })
    .on('dragstart', function() {
      __broadcastEvent.call( card, queue, 'movestart', socket, 'movestart' );
    })
    .on('dragend', function() {
      __broadcastEvent.call( card, queue, 'moveend', socket, 'update', true );
    });
    
  socket
    .on('card:update', function( data ) {
      if ( card.id === data.cardid ) {
        __moveTo.call( card, queue, socket, shape, data.x, data.y );
      }
    })
    .on('card:tagged', function( data ) {
      if ( card.id === data.cardid ) {
        __addTag.call( card, queue, socket, shape, data.color );
      }
    })
    .on('card:untagged', function( data ) {
      if ( card.id === data.cardid ) {
        __removeTag.call( card, queue, socket, shape );
      }
    });
};

function __broadcastEvent( queue, client, socket, server, remote ) {  
  var data = __getCoordinates.call( this );
  
  queue.trigger( this, 'card:' + client, data );
  
  if ( remote ) {
    socket.emit( 'card:' + server, data );
  }
}

function __moveTo( queue, socket, shape, x, y, islocal ) {
  __broadcastEvent.call( this, queue, 'movestart', socket, 'movestart' );
  
  shape.moveTo( x, y );
  
  __broadcastEvent.call( this, queue, 'moveend', socket, 'update', islocal );
  
  return this;
};

function __addTag( queue, socket, shape, color, islocal ) {
  this.color = color;
  
  shape.tag( this.color );
  
  __broadcastEvent.call( this, queue, 'tagged', socket, 'tagged', islocal );
  
  return this;
};

function __removeTag( queue, socket, shape, islocal ) {
  shape.untag();
  
  __broadcastEvent.call( this, queue, 'untagged', socket, 'untagged', islocal );
  
  return this;
};

// public methods

Card.prototype.allowDrag = function() {
  this.shape.setDraggable( true );
  this.active = true;
  
  return this;
};

Card.prototype.disallowDrag = function() {
  this.shape.setDraggable( false );
  this.active = false;
  
  return this;
};

return Card;

})();