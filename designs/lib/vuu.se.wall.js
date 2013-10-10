
var Wall = (function() {

// constructor

var counter = 0;

function Wall() {
  var wall = this;
  
  this.id = 'board_' + (++counter);
        
  var boards = [];
  var pockets = [];

  // public functions

  wall.addBoard = function( board ) {
    boards.push( board );
  };

  wall.getBoard = function( index ) {
    return boards[ index ];
  };

  wall.addPocket = function( pocket ) {
    pockets.push( pocket );
  };

  wall.getPocket = function( index ) {
    return pockets[ index ];
  };
  
  return wall;
}

return Wall;

})();