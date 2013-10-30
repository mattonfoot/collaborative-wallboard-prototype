
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
  var shape = new Kinetic.Group({
    x: region.x || 5,
    y: region.y || 5,
    draggable: true
  });
  var color = __asColor( region.value );

  var background = __createBackground( region.width, region.height, color || colors.fill, shadow.color );
  
  shape.add( background );
  shape.add( __createTitleText( region.width, region.value ) );
  
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

function __createBackground( w, h, fill, shadow ) {
  return new Kinetic.Rect({
    x: 0,
    y: 0,
    width: w,
    height: h,
    fill: fill,
    shadowOpacity: 0.5,
    shadowColor: shadow
  });
};
    
function __createTitleText( w, title ) {
  return new Kinetic.Text({
    x: 5,
    y: 5,
    width: w - 10,
    text: title,
    fontSize: 16,
    fontFamily: 'Calibri',
    fontWeight: 600,
    fill: '#666',
    align: 'center'
  });
};

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
    background.setShadowBlur( shadow.blur.active );
    background.setShadowOffset( shadow.offset.active );
    
    shape.moveToTop();
    
    __redrawLayer();

    return shape;
  };
  
  function __displayInactiveState() {
    background.setShadowBlur( shadow.blur.inactive );
    background.setShadowOffset( shadow.offset.inactive );
    
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