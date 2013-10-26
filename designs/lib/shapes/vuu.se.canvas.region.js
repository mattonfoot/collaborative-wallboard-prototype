
  // emits:  
  
  // triggers:  canvasregion:activated, canvasregion:deactivated, canvasregion:moved, canvasregion:resized
  
  // on (socket):  
  
  // on (queue):  region:moveend --> [region:movestart] + [region:moveend] + canvasregion:moved, region:resizeend --> [region:resizestart] + [region:resizeend] + canvasregion:resized


  
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
  
  // triggers
  
  queue
    .on( shape, 'region:moved', function( data ) {
      if ( region.id === data.id &&
          ( shape.getX() != data.x || shape.getY() != data.y ) ) {
        __moveTo( data.x, data.y );
      }
    })
    .on( shape, 'region:resized', function( data ) {    
      if ( region.id === data.id &&
          ( shape.width != data.width || shape.height != data.height ) ) {
        __resizeTo( data.width, data.height );
      }
    })
    .on( shape, 'region:updated', function( data ) {    
      if ( region.id === data.id &&
          ( shape.width != data.width || shape.height != data.height || shape.getX() != data.x || shape.getY() != data.y ) ) {
        __moveTo( data.x, data.y );
        __resizeTo( data.width, data.height );
      }
    });
  
  shape
    .on('mousedown touchstart', function() {
      __displayActiveState(); 
      
      queue.trigger( shape, 'canvasregion:activated', { region: region } ); // could the board catch this in a canvas event bubble?
    })
    .on('mouseup touchend', function() {
      __displayInactiveState();
      
      queue.trigger( shape, 'canvasregion:deactivated', { region: region } );
    })
    .on('dragend', function() {
      queue.trigger( shape, 'canvasregion:moved', { region: region, x: shape.getX(), y: shape.getY() } );
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
  
  function __displayActiveState() {
    shape.setShadowBlur( shadow.blur.active );
    shape.setShadowOffset( shadow.offset.active );
    
    shape.moveToTop();
    
    __redrawLayer();

    return shape;
  };
  
  function __displayInactiveState() {
    shape.setShadowBlur( shadow.blur.inactive );
    shape.setShadowOffset( shadow.offset.inactive );
    
    __redrawLayer();

    return shape;
  };
  
  function __moveTo( x, y ) {
    shape.moveToTop();
    
    shape.setX( x );
    shape.setY( y );
    
    __redrawLayer();
  };
  
  function __resizeTo( width, height ) {
    shape.moveToTop();
    
    shape.setSize( width, height );
    
    __redrawLayer();
  };
  
  __displayInactiveState();
  
  // instance

  return shape;
}

// public methods

return CanvasRegion;

})();