
var Wall = (function() {

// constructor

function Wall( queue, data ) {
  var wall = this;
  
  wall.id = data.id;
  wall.links = wall.links || {};
        
  wall.links.boards = [];
  wall.links.pockets = [];
  
  var activeboard;

  // private

  function __activateBoard( board ) {    
    if (!board) {
      return wall;
    }
    
    if (activeboard) {    
      activeboard.deactivate();
    }
    
    activeboard = board;
    activeboard.activate();

    return wall;
  }

  // public functions

  wall.getId = function() {
    return wall.id;
  };

  wall.addBoard = function( board ) {   
    if ( wall.getBoardById( data.id ) ) {      
      return false; // we already have it
    }
  
    wall.links.boards.push( board );
        
    queue.trigger( wall, 'wall:boardadded', { wall: wall, board: board } );
    
    if (!activeboard) {
      wall.setActiveBoard();
    }
    
    return true;
  };

  wall.getBoard = function( index ) {
    return wall.links.boards[ index ];
  };

  wall.getBoardById = function( id ) {
    var result;
    
    wall.links.boards.forEach(function( board ) {
      if ( board.getId() == id ) {
        result = board;
      }
    });
  
    return result;
  };
  
  wall.setActiveBoard = function( index ) {
    index = index || 0;
    var len = wall.links.boards.length;
    
    if ( index >= len || index < 0 ) {
      return wall;
    }
    
    return __activateBoard( wall.links.boards[ index ] );
  };
  
  wall.setActiveBoardById = function( id ) {
    var board;
    wall.links.boards.forEach(function( b ) {
      if (b.id == id) {
        board = b;
      }
    });
    
    return __activateBoard( board );
  };
  
  wall.getActiveBoard = function() {
    return activeboard;
  };

  wall.addPocket = function( pocket ) {
    wall.links.pockets.push( pocket );
        
    queue.trigger( wall, 'wall:pocketadded', { wall: wall, pocket: pocket } );
    
    return wall;
  };

  wall.getPocket = function( index ) {
    return wall.links.pockets[ index ];
  };

  wall.getPocketById = function( id ) {
    var result;
    
    wall.links.pockets.forEach(function( pocket ) {
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