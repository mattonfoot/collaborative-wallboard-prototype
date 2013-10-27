
  // emits:  card:movestart, card:moveend, card:tagged, card:untagged
  
  // triggers:  card:movestart, card:moveend, card:tagged, card:untagged
  
  // on (socket):  card:moveend --> card:movestart + card:moveend, card:tagged --> card:tagged, card:untagged --> card:untagged
  
  // on (queue):  

var Card = (function() {

function Card( queue, data ) {
  var card = this;
  
  card.id = data.id;  
  card.links = data.links || {};
  card.x = data.x;
  card.y = data.y;
  card.width = 100;
  card.height = 65;
  card.tagged = data.tagged || '';
  // triggers
  
  queue
    .on( card, 'canvascard:moved', function( data ) {
      if ( card.id === data.card.id &&
          ( card.x != data.x || card.y != data.y ) ) {
        __moveTo( data.x, data.y );
    
        __broadcastEvent( 'moved' );
      }
    })
    .on( card, 'card:updated', function( data ) {  
      if ( card.id === data.id &&
          ( card.x != data.x || card.y != data.y ) ) {
        __moveTo( data.x, data.y );
      }
    });
  
  // private

  function __broadcastEvent( ev ) {  
    queue.trigger( card, 'card:' + ev, { card: card } );
  }
  
  function __moveTo( x, y ) {
    card.x = x;
    card.y = y;
  }
  
  function __tag( color ) {
    card.tagged = color;
  }
  
  function __untag() {
    card.tagged = false;
  }
  
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
  
  card.tag = function( color ) {
    __tag( color );
    
    __broadcastEvent( 'tagged' );
    
    return card;
  };
  
  card.untag = function() {
    __untag();
    
    __broadcastEvent( 'untagged' );
    
    return card;
  };
  
  return card;
}

return Card;

})();