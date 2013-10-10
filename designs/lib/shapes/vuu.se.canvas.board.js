var BoardCanvas = (function() {

var cardUpdateEvents = [ 'board:cardcreate', 'card:active', 'card:inactive', 'card:movestart', 'card:moveend', 'card:tagged', 'card:untagged' ];
var regionUpdateEvents = [ 'board:regioncreate', 'region:active', 'region:inactive', 'region:movestart', 'region:moveend' ];

// constructor

function Board( stage, queue, options ) { 
  var shape = this;
  
  // private methods
  
  shape.regions = new Kinetic.Layer({
    clip: [ options.x, options.y, options.w, options.h ]
  });
  stage.add( shape.regions );
  regionUpdateEvents.forEach(function( ev ) {
    queue.on( shape, ev, function() { shape.regions.batchDraw(); });
  });
  
  shape.cards = new Kinetic.Layer({
    clip: [ options.x, options.y, options.w, options.h ]
  });
  stage.add( shape.cards );
  cardUpdateEvents.forEach(function( ev ) {
    queue.on( shape, ev, function() { shape.cards.batchDraw(); });
  });
  
  // instance
  
  return this;
};

return Board;

})();
