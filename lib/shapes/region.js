// defaults

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

function CanvasRegion( queue, ui, region ) {
    var pos = region.getPosition();

    var shape = new Kinetic.Group({
        id: region.getId(),
        x: pos.x || 5,
        y: pos.y || 5,
        draggable: true
    });
    var color = __asColor( region.getColor() );
    var resizing = false;

    var size = region.getSize();

    var background = __createBackground( size.width, size.height, color || colors.fill, shadow.color );
    var handle = __createHandle( size.width, size.height );
    var title = __createTitleText( size.width, region.getLabel() );

    shape.add( background );
    shape.add( title );
    shape.add( handle );

    // triggers

    queue.subscribe( 'region.moved', function( data ) {
      var pos = region.getPosition();

      if ( region.getId() === data.region &&
          ( shape.getX() != pos.x || shape.getY() != pos.y ) ) {
        __moveTo( pos.x, pos.y );
      }
    });

    queue.subscribe( 'region.resized', function( data ) {
      var size = region.getSize();

      if ( region.getId() === data.region &&
          ( shape.getWidth() != size.width || shape.getHeight() != size.height ) ) {
        __resizeTo( size.width, size.height );
      }
    });

    queue.subscribe( 'region.updated', function( data ) {
      if ( region.getId() === data.region ) {
        __UpdateDisplay( region );
      }
    });

    shape
      .on('mousedown touchstart', function() {
        __displayActiveState();

        ui.emit( 'region.activate', region );
      })
      .on('mouseup touchend', function() {
        __displayInactiveState();

        ui.emit( 'region.deactivate', region );
      })
      .on('dragend', function() {
        region.move({
          region: region.getId(),
          x: shape.getX(),
          y: shape.getY()
        });
      })
      .on('dblclick dbltap', function( e ) {
        e.cancelBubble = true;
        shape.getStage().preventEvents = true;

        ui.emit( 'region.edit', region.getId() );
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

        region.resize({
          region: region.getId(),
          width: background.getWidth(),
          height: background.getHeight()
        });
      });

    // private methods

    function __createBackground( w, h, fill, shadow ) {
      return new Kinetic.Rect({
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill: fill,
        opacity: 0.1,
        shadowOpacity: 0.5,
        shadowColor: shadow
      });
    }

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
    }

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
    }

    function __redrawLayer() {
      try {
        var layer = shape.getLayer();

        if (layer) {
          layer.batchDraw();
        }
      } catch(e) {
      }
    }

    function __UpdateDisplay( region ) {
      title.setText( region.getLabel() || "" );

      color = __asColor( region.getColor() );

      background.setFill( color || colors.fill );

      __redrawLayer();
    }

    function __asColor( color ) {
      if ( color ) {
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
    }

    function __displayInactiveState() {
      background.setShadowBlur( shadow.blur.inactive );
      background.setShadowOffset( shadow.offset.inactive );

      handle.setOpacity( 0 );

      __redrawLayer();

      return shape;
    }

    function __moveTo( x, y ) {
      shape.moveToTop();

      shape.setX( x );
      shape.setY( y );

      __redrawLayer();
    }

    function __resizeTo( width, height ) {
      shape.moveToTop();

      background.size({ width: width, height: height });
      title.setWidth( width - 10 );

      __redrawLayer();
    }

    __displayInactiveState();

    // instance

    return shape;
}

module.exports = CanvasRegion;
