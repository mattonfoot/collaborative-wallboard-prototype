var Card = (function() {

function Card( queue, socket, data ) {
  var card = this;
  
  card.id = data.id;  
  card.links = data.links || {};
  card.x = data.x;
  card.y = data.y;
  card.tagged = data.tagged || '';
  
  // private

  function __broadcastEvent( ev ) {  
    queue.trigger( card, 'card:' + ev, { card: card } );
    
    socket.emit( 'card:' + ev, { card: card } );
  };
  
  // triggers

  socket
    .on('card:moveend', function( data ) {
      if ( card.id == data.card.id ) {
        card.moveTo( data.card.x, data.card.y );
      }
    })
    .on('card:tagged', function( data ) {
      if ( card.id === data.id ) {
        card.tag( data.tagged );
      }
    })
    .on('card:untagged', function( data ) {
      if ( card.id === data.id ) {
        card.untag();
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
    if ( card.x !== x || card.y !== y) {
      __broadcastEvent( 'movestart' );
      
      card.x = x;
      card.y = y;
      
      __broadcastEvent( 'moveend' );
    }
    
    return card;
  };
  
  card.tag = function( color ) {
    card.tagged = color;
    
    __broadcastEvent( 'tagged' );
    
    return card;
  };
  
  card.untag = function() {
    card.tagged = false;
    
    __broadcastEvent( 'untagged' );
    
    return card;
  };
  
  return card;
}

return Card;

})();