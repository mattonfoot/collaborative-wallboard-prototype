var BoardFactory = (function() {

// constructor

function BoardFactory( queue, socket, wall ) {
  var factory = this;

  // private methods

  function __buildBoard( type, data ) {
    var config = {
      x: 1,
      y: 53,
      w: 796,
      h: 44
    };
    
    if ( data.boardid ) {
      config.boardid = data.boardid;
    }
        
    config.shape = new BoardCanvas( stage, queue, config );
    // config.shelf = new ShelfCanvas();
    
    var board = new Board( queue, config );
    board.addShelf( new Shelf( stage, queue ) );
    
    new CardFactory( queue, socket, board );
    
    config.boardid = board.id;
    
    queue.trigger( board, 'board'+ type +':start', config );
    
    wall.addBoard( board );
    
    if ( type === 'create' ) {
      socket.emit( 'board:create', config );
    }
      
    queue.trigger( board, 'board'+ type +':end', config );
  };
  
  // triggers
  
  queue.on( factory, 'board:add', function( data ) {
    __buildBoard( 'create', data );
  });
  
  socket.on( 'board:create', function( data ) {
    __buildBoard( 'clone', data );
  });
  
  // public methods
  
  // instance
  
  return factory;
}

// export

return BoardFactory;

})();