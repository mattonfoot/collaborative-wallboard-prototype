var Card = (function() {

function Card( queue, socket, data ) {
  var card = this;
  
  card.id = data.id;  
  card.links = data.links || {};
  card.x = data.x;
  card.y = data.y;
  card.tagged = data.tagged || false;
  
  // private

  function __broadcastEvent( ev ) {  
    queue.trigger( card, 'card:' + ev, { card: card } );
    
    socket.emit( 'card:' + ev, { card: card } );
  };
  
  // triggers

  socket
    .on('card:moveend', function( data ) {
      if ( card.id === data.id ) {
        card.moveTo( data.x, data.y );
      }
    })
    .on('card:tagged', function( data ) {
      if ( card.id === data.id ) {
        card.addTag();
      }
    })
    .on('card:untagged', function( data ) {
      if ( card.id === data.id ) {
        card.removeTag();
      }
    });
  
  // public functions

  card.getId = function() {
    return card.id;
  };

  card.getPocketId = function() {
    return card.links.pocket;
  };

  card.getBoardId = function() {
    return card.links.board;
  };

  card.getPosition = function() {
    return { 
      board: card.getBoardId(),
      x: card.x,
      y: card.y
    };
  };
  
  card.moveTo = function( x, y ) {
    __broadcastEvent( 'movestart' );
    
    card.x = x;
    card.y = y;
    
    __broadcastEvent( 'moveend' );
    
    return card;
  };
  
  card.addTag = function() {
    card.tagged = true;
    
    __broadcastEvent( 'tagged' );
    
    return card;
  };
  
  card.removeTag = function() {
    card.tagged = false;
    
    __broadcastEvent( 'untagged' );
    
    return card;
  };
  
  return card;
}

return Card;

})();




    
  /*
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
  */