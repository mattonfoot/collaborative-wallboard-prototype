
var Board = (function() {

// constructor

function Board( id, eq, options ) { 
  this.options = options || { w: 800, h: 600 };
  
  this.id = id;
  this.eq = eq;
  
  if (this.shape) console.log('I have one...');
  
  createUIElement.call( this, this.options.w, this.options.h );
  
  this.regions = [];
  this.cards = [];
  
  // add gestures we care about
  addTapStartWatcher.call( this, this.shape, this.eq );
  addTapEndWatcher.call( this, this.shape, this.eq );
  addDblTapEndWatcher.call( this, this.shape, this.eq );
}



// private functions

function createUIElement( w, h ) {
  var shape = new Kinetic.Stage({
    container: 'container', 
    width: w, 
    height: h 
  });
  
  shape.regions = new Kinetic.Layer();
  shape.cards = new Kinetic.Layer();
  
  shape
    .add( shape.regions )
    .add( shape.cards );
  
  this.shape = shape;
};

function addTapStartWatcher() {
  var board = this;

  var stage = 0;
  var timeout;

  board.shape
    .on('mousedown touchstart', function( e ) {
      var pos = board.shape.getMousePosition();
      
      var evName = 'board:tapstart';
        
      if ( stage === 1 ) {
        stage = 2;
        
        evName = 'board:dbltapstart';
        
        clearTimeout( timeout );
        
      } else {
        stage = 1;
        
        timeout = setTimeout(function() { stage = 0; }, 500);        
      } 
          
      board.eq.trigger( board, evName, pos);
    });
};

function addTapEndWatcher() {
  var board = this;

  board.shape
    .on('mouseup touchend', function( e ) {      
      board.eq.trigger( board, 'board:tapend', board.shape.getMousePosition());
    });
};

function addDblTapEndWatcher() {
  var board = this;

  board.shape
    .on('dblclick dbltap', function( e ) {      
      board.eq.trigger( board, 'board:dbltap', board.shape.getMousePosition());
    });
};

function hasCollided( a, b ) {
  return !(((a.getY() + a.getHeight()) < (b.getY())) ||
      (a.getY() > (b.getY() + b.getHeight())) ||
      ((a.getX() + a.getWidth()) < b.getX()) ||
        (a.getX() > (b.getX() + b.getHeight())
    ));
};


// public functions

Board.prototype.refreshUI = function() {
  this.shape.regions.batchDraw();
  this.shape.cards.batchDraw();
};

Board.prototype.updateCard = function( card ) {
  card.removeTag();

  this.regions.forEach(function( region ) {
    if ( hasCollided( region.shape, card.shape ) ) {
      card.addTag( region.shape.getFill() );
    }
  });
};



Board.prototype.addRegion = function( region ) {
  this.regions.push( region );
  
  this.shape.regions.add( region.shape );  
  this.refreshUI();
      
  this.eq.trigger( this, 'board:regioncreate', { region: region } );
};

Board.prototype.allowRegionDrag = function() {
  this.regions.forEach(function( region ) {
    region.allowDrag();
  });
};

Board.prototype.disallowRegionDrag = function() {
  this.regions.forEach(function( region ) {
    region.disallowDrag();
  });
};



Board.prototype.addCard = function( card ) {
  this.cards.push( card );
  
  this.shape.cards.add( card.shape );  
  this.refreshUI();
      
  this.eq.trigger( this, 'board:cardcreate', { card: card } );
};

Board.prototype.allowCardDrag = function() {
  this.cards.forEach(function( card ) {
    card.allowDrag();
  });
};

Board.prototype.disallowCardDrag = function() {
  this.cards.forEach(function( card ) {
    card.disallowDrag();
  });
};


return Board;

})();

