// defaults

var zoomFactor = 0.02;
var panFactor = 1;
var panThreshold = 10;
var pinchThreshold = 0.2;
var scrollFactor = 0.095;
var minScale = 0.1;
var maxScale = 20;


// constructor

function CanvasView( queue, ui, view, options ) {
    var $container = $( '#' + view.getId() );

    var shape = new Kinetic.Stage({
        container: view.getId(),
        width: options.width,
        height: options.height,
        draggable: true
    });

    $container.data( 'stage', shape );

    shape.regions = new Kinetic.Layer();
    shape.add( shape.regions );

    shape.cards = new Kinetic.Layer();
    shape.add( shape.cards );




    var mc = new Hammer.Manager( $container[0] );
    mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: panThreshold, pointers: 2 }) );
    mc.add( new Hammer.Pinch({ threshold: pinchThreshold, pointers: 2 }) );

    Hammer.Manager.prototype.emit = (function( originalEmit ) {
      return function( type, data ) {
        originalEmit.call( this, type, data );

        var evt = $.Event( type, data );
        $( this.element ).trigger( evt );
      };
    })( Hammer.Manager.prototype.emit );

    shape.on( 'contentDblclick contentDbltap', function( ev ) {
      if ( shape.preventEvents ) {
        shape.preventEvents = false;

        return;
      }

      ui.emit( 'view.edit', view.getId() );
    });









    // public methods

    shape.plotPointer = function( loc ) {
      var rect = $container.find('> .kineticjs-content')[0].getBoundingClientRect();
      var stagePos = this.getPosition();
      var width = this.getWidth();
      var height = this.getHeight();

      scale = scale || this.getScale().x;

      // mouse pos relative to top left corner of element
      var mouseX = loc.clientX - rect.left;
      var mouseY = loc.clientY - rect.top;

      return {
        x: ( ( stagePos.x * -1 ) + ( ( mouseX / ( rect.right - rect.left ) ) * width ) ) / scale,
        y: ( ( stagePos.y * -1 ) + ( ( mouseY / ( rect.bottom - rect.top ) ) * height ) ) / scale
      };
    };

    shape.addRegionRequest = function( data ) {
      var pointer = shape.plotPointer( data );

      ui.emit( 'region.add', {
        wall: view.getWall(),
        view: view.getId(),
        x: pointer.x,
        y: pointer.y
      });
    };

    shape.addRegion = function( canvasregion ) {
      shape.regions.add( canvasregion );

      shape.regions.batchDraw();
    };

    shape.createCard = function( data ) {
      var pointer = shape.plotPointer( data );

      ui.emit( 'card.create', {
        wall: view.getWall(),
        view: view.getId(),
        x: pointer.x,
        y: pointer.y
      });
    };

    shape.addCard = function( canvascard ) {
      shape.cards.add( canvascard );

      shape.cards.batchDraw();
    };

    shape.resize = function( size ) {
      shape.setWidth( size.width );
      shape.setHeight( size.height );

      shape.batchDraw();
    };

    var zoomTimeout;
    shape.zooming = false;
    shape.zoom = function( evt ) {
      if ( shape.panning ) {
        return;
      }

      if ( zoomTimeout ) {
        clearTimeout( zoomTimeout );
      }
      shape.zooming = true;
      setTimeout(function() { shape.zooming = false; }, 100);

      var config = calculateZoom( evt, shape );

      shape.setScale({ x: config.targetScale, y: config.targetScale });
      shape.setPosition({ x: shape.getX() + config.offset.x, y: shape.getY() + config.offset.y });

      ui.emit( 'view.scaled', { id: view.getId(), scale: config.targetScale, offset: config.offset });

      shape.batchDraw();
    };

    var panTimeout;
    shape.panning = false;
    shape.pan = function( evt ) {
      if ( shape.zooming ) {
        return;
      }

      if ( panTimeout ) {
        clearTimeout( panTimeout );
      }
      shape.panning = true;
      panTimeout = setTimeout(function() { shape.panning = false; }, 100);

      var factor = ( evt.srcEvent && evt.srcEvent.changedTouches ) ? panFactor : scrollFactor;
      var location = {
        x: shape.getX() + ( evt.deltaX * factor ),
        y: shape.getY() + ( evt.deltaY * factor )
      };

      shape.setPosition( location );

      ui.emit( 'view.panned', { id: view.getId(), location: location });

      shape.batchDraw();
    };


    // triggers
    ui.on( 'ui.resize', shape.resize.bind( shape ) );

    $container.on( 'mousewheel panmove pinchmove', stopMouseWheelPropogation );

    $container.on( 'mousewheel',  handleCtrlMouseWheelEvent );
    $container.on( 'panmove',     handlePanMoveEvent );
    $container.on( 'pan',         shape.pan.bind( shape ));

    $container.on( 'mousewheel',  handleMouseWheelEvent );
    $container.on( 'pinchmove',   handlePinchMoveEvent );
    $container.on( 'zoom',        shape.zoom.bind( shape ));

    /*
    $stage.on( 'reset', resetStageView.bind( stage ));

    // adding a new card
    $toolbar.on( 'mousedown touchstart', '[data-new="card"]', newCardStart );
    $stage.on( 'mousemove touchmove', newCardDrag );
    $( document.body ).on( 'mouseup touchend', newCardEnd.bind( stage ) );
    $stage.on( 'newCardRequest', newCard.bind( stage ) );

    // adding a new region
    $toolbar.on( 'click', '[data-new="region"]', newRegionRequest.bind( stage ) );
    $(document.body).on( 'keydown', cancelRegionRequest.bind( stage ) );

    $stage.on( 'mousedown touchstart', newRegionStart.bind( stage ) );
    $stage.on( 'mousemove touchmove', newRegionDrag.bind( stage ) );
    $stage.on( 'mouseup touchend', newRegionEnd.bind( stage ) );
    $stage.on( 'newRegionRequest', newRegion.bind( stage ) );
    */

    // instance

    return shape;
}



// zoom requests

function handleCtrlMouseWheelEvent( evt ) {
  if ( !evt.ctrlKey ) {
    return;
  }

  var delta = evt.originalEvent.deltaY;

  triggerZoom.call( this, evt, delta );
}

function handlePinchMoveEvent( evt ) {
  var delta = evt.scale;

  triggerZoom.call( this, evt, delta );
}

function triggerZoom( evt, d ) {
  var $container = $( this );

  var ev = $.Event('zoom', {
    delta: d,
    clientX: evt.center && evt.center.x || evt.clientX,
    clientY: evt.center && evt.center.y || evt.clientY
  });

  $container.trigger( ev );
}

// pan requests

function handleMouseWheelEvent( evt ) {
  if ( evt.ctrlKey ) {
    return;
  }

  var deltaX = evt.originalEvent.wheelDeltaX;
  var deltaY = evt.originalEvent.wheelDeltaY;

  triggerPan.call( this, evt, deltaX, deltaY );
}

var previousPointer = { x:0, y: 0 };
function handlePanMoveEvent( evt ) {
  var $container = $( this );
  var e = {
    clientX: evt.center && evt.center.x || evt.clientX,
    clientY: evt.center && evt.center.y || evt.clientY
  };
  var plot = $container.data( 'stage' ).plotPointer( e );

  var deltaX = previousPointer.x - plot.x;
  var deltaY = previousPointer.y - plot.y;

  triggerPan.call( this, evt, deltaX, deltaY );

  previousPointer = { x: plot.x, y: plot.y };
}

function triggerPan( evt, dx, dy ) {
  var $container = $( this );

  var ev = $.Event('pan', {
    deltaX: dx,
    deltaY: dy,
    clientX: evt.clientX,
    clientY: evt.clientY
  });

  $container.trigger( ev );
}





function stopMouseWheelPropogation( evt ) {
  var e = evt.originalEvent || evt.srcEvent;
  if ( !e || e.wheelDelta === 0 ) {
    return;
  }

  evt.preventDefault();
}

function calculateZoom( evt, shape ) {
  var curScale = shape.getScale().x;
  var targetScale = evt.scale || curScale - ( evt.delta * zoomFactor );
  if ( targetScale <= minScale || targetScale >= maxScale ) {
    return;
  }

  var factor = curScale / targetScale;
  var curPointer = shape.plotPointer( evt, curScale );
  var offset = {
    x: ( ( curPointer.x * factor ) - curPointer.x ) * targetScale,
    y: ( ( curPointer.y * factor ) - curPointer.y ) * targetScale
  };

  return {
    targetScale: targetScale,
    offset: offset
  };
}

module.exports = CanvasView;
