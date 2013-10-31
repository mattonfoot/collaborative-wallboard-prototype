
  // emits:  
  
  // triggers:  canvasboard:canvasregionadded, canvasboard:canvascardadded
  
  // on (socket):  
  
  // on (queue):  

var CanvasBoard  = (function() {
  
var min_scale = 0.1;

// constructor

function CanvasBoard( queue, options ) { 
  var shape = new Kinetic.Stage({
    container: options.container,
    width: options.width,
    height: options.height,
    draggable: true
  });
  
  shape.regions = new Kinetic.Layer();
  shape.add( shape.regions );
  
  shape.cards = new Kinetic.Layer();
  shape.add( shape.cards );
  
  // triggers
  
  var $container = $( '#' + options.container );
  var scale = 1;

  $container
    .bind('mousewheel', function( e, delta ) {
      
      delta = e.originalEvent.wheelDelta;
      
      //prevent only the actual wheel movement
      if (delta !== 0) {
        e.preventDefault();
      }

      var cur_scale;
      if (delta > 0) {
        cur_scale = scale + Math.abs(delta / 640);
      } else {
        cur_scale = scale - Math.abs(delta / 640);
      }
      
      if (cur_scale > min_scale) {
        
        var cnvsPos = __getPos( $container );

        var Apos = shape.getAbsolutePosition();
        
        var mousePos = shape.getMousePosition();

        var smallCalc  = (e.pageX - Apos.x - cnvsPos.x)/scale;
        var smallCalcY = (e.pageY - Apos.y - cnvsPos.y)/scale;

        var endCalc = (e.pageX - cnvsPos.x) - cur_scale*smallCalc;
        var endCalcY = (e.pageY - cnvsPos.y) - cur_scale*smallCalcY;

        scale = cur_scale;

        shape.setPosition( endCalc, endCalcY);

        shape.regions.setScale(cur_scale);
        shape.regions.batchDraw();

        shape.cards.setScale(cur_scale);
        shape.cards.batchDraw();
      }
      
      
    });
  
  // private methods
    
  function __getPos(el){
		for (var lx=0, ly=0;
         el != null;
         lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    	return {x: lx,y: ly};
	}
  
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
