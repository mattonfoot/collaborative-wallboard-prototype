var Board = (function() {

// constructor

function Board( queue, options ) {
  var board = this;
  
  var shape = options.shape;
  
  var regions = [];
  var cards = [];
  var shelf;
  
  board.addRegion = function( region ) {
    regions.push( region );
    
    shape.regions.add( region.shape ); 
        
    queue.trigger( board, 'board:regioncreate', { region: region } );
  };
  
  board.getRegion = function( index ) {
    return regions[ index ];
  };

  board.addCard = function( card ) {
    cards.push( card );
    
    shape.cards.add( card.shape );
        
    queue.trigger( board, 'board:cardcreate', { card: card } );
  };
  
  board.getCard = function( index ) {
    return cards[ index ];
  };

  board.addShelf = function( s ) {
    shelf = s;
        
    queue.trigger( board, 'board:shelfadded', { shelf: shelf } );
  };
  
  board.getShelf = function( index ) {
    return shelf;
  };
  
  return this;
}



// private functions

/*
function hasCollided( a, b ) {
  return !(((a.getY() + a.getHeight()) < (b.getY())) ||
      (a.getY() > (b.getY() + b.getHeight())) ||
      ((a.getX() + a.getWidth()) < b.getX()) ||
        (a.getX() > (b.getX() + b.getHeight())
    ));
};


// public functions

Board.prototype.updateCard = function( card ) {
  card.removeTag();

  this.regions.forEach(function( region ) {
    if ( hasCollided( region.shape, card.shape ) ) {
      card.addTag( region.shape.getFill() );
    }
  });
};
*/

return Board;

})();

