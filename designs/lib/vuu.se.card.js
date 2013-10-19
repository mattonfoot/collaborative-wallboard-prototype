var Card = (function() {

function Card( queue, socket, data ) {
  var card = this;
  
  card.id = data.id;  
  card.links = data.links || {};
  card.x = data.x;
  card.y = data.y;
  card.tagged = data.tagged || '';
  
  // private

  function __broadcastEvent( ev, broadcast ) {  
    queue.trigger( card, 'card:' + ev, { card: card } );
    
    if ( broadcast ) {
      socket.emit( 'card:' + ev, { card: card } );
    }
  }
  
  function __moveTo( x, y, broadcast ) {
    if ( card.x !== x || card.y !== y) {
      __broadcastEvent( 'movestart', broadcast );
      
      card.x = x;
      card.y = y;
      
      __broadcastEvent( 'moveend', broadcast );
    }
    
    return card;
  }
  
  function __tag( color, broadcast ) {
    card.tagged = color;
    
    __broadcastEvent( 'tagged', broadcast );
    
    return card;
  }
  
  function __untag( broadcast ) {
    card.tagged = false;
    
    __broadcastEvent( 'untagged', broadcast );
    
    return card;
  }
  
  // triggers

  socket
    .on('card:moveend', function( data ) {
      if ( card.id == data.id ) {
        __moveTo( data.x, data.y, false );
      }
    })
    .on('card:tagged', function( data ) {
      if ( card.id === data.id ) {
        __tag( data.tagged, false );
      }
    })
    .on('card:untagged', function( data ) {
      if ( card.id === data.id ) {
        __untag( false );
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
    return __moveTo( x, y, true );
  };
  
  card.tag = function( color ) {
    return __untag( color, true );
  };
  
  card.untag = function() {
    return __untag( true );
  };
  
  return card;
}

return Card;

})();