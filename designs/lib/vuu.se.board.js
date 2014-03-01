
  // emits:  
  
  // triggers:  board:regionadded, board:cardadded, board:activated, board:deactivated, board:shelfadded
  
  // on (socket):  
  
  // on (queue):  


var Board = (function() {

// constructor

function Board( queue, data ) {
  var board = this;
  
  this.id = data.id;
  this.key = data.key;
  
  var regions = this.regions = [];
  var cards = this.cards = [];
  var shelf;
  
  // public functions

  board.getId = function() {
    return board.id;
  };

  board.getKey = function() {
    return board.key;
  };
  
  board.addRegion = function( region ) {
    if ( board.getCardById( region.id ) ) {
      return false; // we already have it
    }
    
    regions.push( region );
        
    queue.trigger( board, 'board:regionadded', { board: board, region: region } );
    
    return true;
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
    if ( board.getCardById( card.id ) ) {
      return false; // we already have it
    }
    
    cards.push( card );
        
    queue.trigger( board, 'board:cardadded', { board: board, card: card } );
    
    return true;
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
  
  board.activate = function() {
    queue.trigger( board, 'board:activated', { board: board } );
  }
  
  board.deactivate = function() {
    queue.trigger( board, 'board:deactivated', { board: board } );
  }

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

return Board;

})();

