
var Wall = (function() {

// constructor

function Wall( queue, data ) {
  var wall = this;
  
  this.id = data.id;
        
  var boards = wall.boards = [];
  var pockets = wall.pockets = [];
  
  var activeboard;

  // public functions

  wall.getId = function() {
    return wall.id;
  };

  wall.addBoard = function( board ) {
    boards.push( board );
        
    queue.trigger( wall, 'wall:boardadded', { wall: wall, board: board } );
    
    if (!activeboard) {
      this.setActiveBoard();
    }
    
    return wall;
  };

  wall.getBoard = function( index ) {
    return boards[ index ];
  };

  wall.getBoardById = function( id ) {
    var result;
    
    boards.forEach(function( board ) {
      if ( board.getId() == id ) {
        result = board;
      }
    });
  
    return result;
  };
  
  wall.setActiveBoard = function( index ) {
    index = index || 0;
    var len = boards.length;
    
    if ( index >= len || index < 0 ) {
      return this;
    }
    
    if (activeboard) {        
      queue.trigger( wall, 'wall:boarddeactivated', { wall: wall, board: activeboard } );
    }
    
    activeboard = boards[ index ];
        
    queue.trigger( wall, 'wall:boardactivated', { wall: wall, board: activeboard } );

    return this;
  };
  
  wall.setActiveBoardById = function( id ) {
    var board;
    boards.forEach(function( b ) {
      if (b.id == id) {
        board = b;
      }
    });
    
    if (!board) {
      return;
    }
    
    if (activeboard) {        
      queue.trigger( wall, 'wall:boarddeactivated', { wall: wall, board: activeboard } );
    }
    
    activeboard = board;
        
    queue.trigger( wall, 'wall:boardactivated', { wall: wall, board: activeboard } );

    return this;
  };
  
  wall.getActiveBoard = function() {
    return activeboard;
  };

  wall.addPocket = function( pocket ) {
    pockets.push( pocket );
        
    queue.trigger( wall, 'wall:pocketadded', { wall: wall, pocket: pocket } );
    
    return wall;
  };

  wall.getPocket = function( index ) {
    return pockets[ index ];
  };

  wall.getPocketById = function( id ) {
    var result;
    
    pockets.forEach(function( pocket ) {
      if ( pocket.getId() == id ) {
        result = pocket;
      }
    });
  
    return result;
  };
  
  return wall;
}

return Wall;

})();