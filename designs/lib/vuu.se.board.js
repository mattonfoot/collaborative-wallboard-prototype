var Board = (function() {

// constructor

function Board( queue, data ) {
  var board = this;
  
  this.id = data.id;
  
  // var shape = options.shape;
  
  var regions = this.regions = [];
  var cards = this.cards = [];
  var shelf;
  
  // public functions

  board.getId = function() {
    return board.id;
  };
  
  board.addRegion = function( region ) {
    regions.push( region );
    
    // shape.regions.add( region.shape );
        
    queue.trigger( board, 'board:regionadded', { board: board, region: region } );
    
    return board;
  };
  
  board.getRegion = function( index ) {
    return regions[ index ];
  };

  board.getRegionById = function( id ) {
    var result;
    
    regions.forEach(function( region ) {
      if ( region.getId() == id ) {
        result = region;
      }
    });
  
    return result;
  };

  board.addCard = function( card ) {
    cards.push( card );
    
    // shape.cards.add( card.shape );
        
    queue.trigger( board, 'board:cardadded', { board: board, card: card } );
    
    return board;
  };
  
  board.getCard = function( index ) {
    return cards[ index ];
  };

  board.getCardById = function( id ) {
    var result;
    
    cards.forEach(function( card ) {
      if ( card.getId() == id ) {
        result = card;
      }
    });
  
    return result;
  };

  board.addShelf = function( s ) {
    shelf = s;
        
    queue.trigger( board, 'board:shelfadded', { board: board, shelf: shelf } );
    
    return board;
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

