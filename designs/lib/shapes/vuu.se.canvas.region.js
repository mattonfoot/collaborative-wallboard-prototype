var CanvasRegion = (function() {

// defaults

var validColors = [ 'red', 'green', 'blue', 'yellow', 'orange', 'aqua', 'black', 'brown', 'coral', 'crimson', 'cyan', 'gray', 'lime', 'magenta', 'maroon' ];

var size = { width: 100, height: 100 };

var colors = {
  fill: '#eee'
};

var shadow = {
  color: '#eee',
  offset: { active: 1, inactive: 0 },
  blur: { active: 5, inactive: 0 }
};

// constructor

function CanvasRegion( queue, region ) {
  var color = __asColor( region.value ); 
 
  var shape = new Kinetic.Rect({
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,    
    fill: color || colors.fill,
    shadowOpacity: 0.5,
    shadowColor: shadow.color,
    draggable: true
  });
  
  queue
    .on( shape, 'region:moveend', function( data ) {
      if ( region.id === data.region.id &&
          ( shape.getX() != region.x || shape.getY() != region.y ) ) {
        shape.moveTo( region.x, region.y );
      }
    })
    .on( shape, 'region:resizeend', function( data ) {    
      if ( region.id === data.region.id &&
          ( shape.width != data.region.width || shape.height != data.region.height ) ) {
        shape.resizeTo( data.region.width, data.region.height );
      }
    });
  
  shape
    .on('mousedown touchstart', function() {
      shape.displayActiveState();      
      shape.moveToTop();
      
      queue.trigger( shape, 'canvasregion:activated', { region: region } ); // could the board catch this in a canvas event bubble?
    })
    .on('mouseup touchend', function() {
      shape.displayInactiveState();
      
      queue.trigger( shape, 'canvasregion:deactivated', { region: region } );
    })
    .on('dragstart', function() { 
        //queue.trigger( shape, 'canvasregion:movestart', { region: region } );
    })
    .on('drag', function() {        
      // region.moveTo( shape.getX(), shape.getY() );
    })
    .on('dragend', function() {
      region.moveTo( shape.getX(), shape.getY() );
      
      queue.trigger( shape, 'canvasregion:moved', { region: region } );
    });
    
  // private methods
    
  function __redrawLayer() {
    try {
      var layer = shape.getLayer();
      
      if (layer) {
        layer.batchDraw();
      }
    } catch(e) {
    }
  }
  
  function __asColor( color ) {
    if ( color && validColors.indexOf( color ) >= 0 ) {
      return color;
    }
  
    return;
  }
  
  // public methods
  
  shape.displayActiveState = function() {
    shape.setShadowBlur( shadow.blur.active );
    shape.setShadowOffset( shadow.offset.active );
    
    __redrawLayer();

    return shape;
  };
  
  shape.displayInactiveState = function() {
    shape.setShadowBlur( shadow.blur.inactive );
    shape.setShadowOffset( shadow.offset.inactive );
    
    __redrawLayer();

    return shape;
  };
  
  shape.moveTo = function( x, y ) {
    //queue.trigger( shape, 'canvasregion:movestart', { region: region, x: shape.getX(), y: shape.getY() } );  
    shape.moveToTop();
    
    shape.setX( x );
    shape.setY( y );
    
    __redrawLayer();
    
    region.moveTo( shape.getX(), shape.getY() );
    
    queue.trigger( shape, 'canvasregion:moved', { region: region, x: shape.getX(), y: shape.getY() } );
    
    return shape;
  };
  
  shape.resizeTo = function( width, height ) {
    //queue.trigger( shape, 'canvasregion:movestart', { region: region, x: shape.getX(), y: shape.getY() } );  
    shape.moveToTop();
    
    shape.setSize( width, height );
    
    __redrawLayer();
    
    region.resizeTo( shape.getWidth(), shape.getHeight() );
    
    queue.trigger( shape, 'canvasregion:resized', { region: region, width: shape.getWidth(), height: shape.getHeight() } );
    
    return shape;
  };
  
  
  
  shape.displayActiveState();
  
  // instance

  return shape;
}

// public methods

return CanvasRegion;

})();