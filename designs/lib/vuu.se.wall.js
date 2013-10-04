
var Wall = (function() {

// constructor

function Wall( id, eq, options) {
  this.options = options || { w: 800, h: 600 };

  this.id = id;
  this.eq = eq;
        
  this.boards = [];
}

// public functions

Wall.prototype.addBoard = function( board ) {
  this.boards.push( board );
};

return Wall;

})();