
  // emits:  
  
  // triggers:  canvasboard:canvasregionadded, canvasboard:canvascardadded
  
  // on (socket):  
  
  // on (queue):  

var CanvasBoard  = (function() {

// constructor

function CanvasBoard( queue, options ) { 
  var shape = new Kinetic.Stage({ container: options.container, width: options.width, height: options.height });
  
  // private methods
  
  shape.regions = new Kinetic.Layer();
  shape.add( shape.regions );
  
  shape.cards = new Kinetic.Layer();
  shape.add( shape.cards );
  
  // public methods
  
  shape.addRegion = function( canvasregion ) {
    shape.regions.add( canvasregion );
    
    queue.trigger( shape, 'canvasboard:canvasregionadded', { canvasregion: canvasregion });
    
    shape.regions.batchDraw();
  };
  
  shape.addCard = function( canvascard ) {
    shape.cards.add( canvascard );
    
    queue.trigger( shape, 'canvasboard:canvascardadded', { canvascard: canvascard });
    
    shape.cards.batchDraw();
  };
  
  // instance
  
  return shape;
};

return CanvasBoard ;

})();
