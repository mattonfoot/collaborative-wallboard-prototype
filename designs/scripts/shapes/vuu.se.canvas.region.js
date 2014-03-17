var CanvasRegion = (function() {

// defaults

var validColors = [ 'red', 'green', 'blue', 'yellow', 'orange', 'aqua', 'black', 'brown', 'coral', 'crimson', 'cyan', 'gray', 'lime', 'magenta', 'maroon' ];

var size = { width: 100, height: 100 };

var handleSize = 20;

var colors = {
  fill: '#aaa'
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
  var resizing = false;

  var background = __createBackground( region.width, region.height, color || colors.fill, shadow.color );
  var handle = __createHandle( region.width, region.height );
  var title = __createTitleText( region.width, region.value );

  shape.add( background );
  shape.add( title );
  shape.add( handle );

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

  handle
    .on('mousedown touchstart', function() {
      resizing = true;
    })
    .on('mouseup touchend', function() {
      resizing = false;
    })
    .on('dragmove', function( evt ) {
      evt.cancelBubble = true;

      var width = handle.getX() + ( handleSize / 2 );
      var height = handle.getY() + ( handleSize / 2 );

      __resizeTo( width, height );
    })
    .on('dragend', function( evt ) {
      evt.cancelBubble = true;

      queue.trigger( shape, 'canvasregion:resized', { region: region, width: background.getWidth(), height: background.getHeight() } );
    });

  // private methods

function __createBackground( w, h, fill, shadow ) {
  return new Kinetic.Rect({
    x: 0,
    y: 0,
    width: w,
    height: h,
    fill: fill,
    opacity: .1,
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

function __createHandle( w, h ) {
  return new Kinetic.Rect({
    x: w - ( handleSize / 2 ),
    y: h - ( handleSize / 2 ),
    width: handleSize,
    height: handleSize,
    stroke: '#ddd',
    strokeWidth: 2,
    cornerRadius: ( handleSize / 2 ),
    opacity: 0,
    draggable: true
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

    handle.setOpacity( 1 );

    shape.moveToTop();

    __redrawLayer();

    return shape;
  };

  function __displayInactiveState() {
    background.setShadowBlur( shadow.blur.inactive );
    background.setShadowOffset( shadow.offset.inactive );

    handle.setOpacity( 0 );

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

    background.setSize( width, height );
    title.setWidth( width - 10 );

    __redrawLayer();
  };

  __displayInactiveState();

  // instance

  return shape;
}

// public methods

return CanvasRegion;

})();
