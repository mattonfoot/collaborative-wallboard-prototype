var CardFactory = (function() {

// constructor

function CardFactory( queue, socket, board ) {
  var factory = this;
  
  // private methods

  function __buildCard( type, data ) {
    var config = {    
      title: data.title,
      pocketid: data.pocketid,
      x: data.x || 0,
      y: data.y || 0
    };
    
    if ( data.cardid ) {
      config.cardid = data.cardid;
    }
    
    config.shape = new CanvasCard( config );
    var card = new Card( queue, socket, config );
    
    config.cardid = card.id;
    
    queue.trigger( card, 'card'+ type +':start', config );
    
    board.addCard( card );
    
    queue.trigger( card, 'card'+ type +':end', config );
  };
  
  // triggers

  ['pocketcreate:end', 'pocketclone:end'].forEach(function( createOn ) {
    queue.on( factory, createOn, function( data ) {
      __buildCard.call( factory, 'create', data );
    });
  });
  
  socket.on( 'card:create', function( data ) {
    __buildCard.call( factory, 'clone', data );
  });
  
  // instance
  
  return factory;
}

// exports

return CardFactory;

})();