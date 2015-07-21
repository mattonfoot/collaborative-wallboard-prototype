// defaults

var zoomFactor = .02;
var panFactor = 1;
var panThreshold = 10;
var pinchThreshold = .2;
var scrollFactor = .095;
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



    // private methods

    function onOpenRequest( e ) {
        if (shape.preventEvents) {
            shape.preventEvents = false;

            return;
        }

        ui.emit( 'view.edit', view.getId() );
    }

    // prevent drag over to enable file drops
    function onDragOver( ev ) {
      ev.preventDefault();
    }

    // Handle dropped image file - only Firefox and Google Chrome
    function onFileDropRequest( ev ) {
    	ev.preventDefault();

      var files = ev.originalEvent.dataTransfer.files;

    	if (files.length > 0) {
    		var file = files[0];

    		if ( typeof FileReader !== "undefined" ) {
    			var reader = new FileReader();

    			reader.onload = function ( ev ) {
            ui.emit( 'file.drop', { type: file.type, data: ev.target.result });
    			};

          if ( ~file.type.indexOf( 'text' ) ) {
            return reader.readAsText( file );
          }

    			reader.readAsArrayBuffer( file );
    		}
    	} else {
        var items = ev.originalEvent.dataTransfer.items;

        if (items.length > 0) {
      		var item = items[0];
          var type = item.type;

          item.getAsString(function ( result ) {
            ui.emit( 'file.drop', { type: 'text/plain', data: result });
    			});
      	}
      }
    }









    // public methods

    shape.addRegion = function( canvasregion ) {
      shape.regions.add( canvasregion );

      shape.regions.batchDraw();
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

      var curScale = shape.getScale().x;
      var targetScale = evt.scale || curScale - ( evt.delta * zoomFactor );
      if ( targetScale <= minScale || targetScale >= maxScale ) {
        return;
      }

      var factor = curScale / targetScale;
      var curPointer = plotPointer( evt, shape, curScale );
      var offset = {
        x: ( ( curPointer.x * factor ) - curPointer.x ) * targetScale,
        y: ( ( curPointer.y * factor ) - curPointer.y ) * targetScale
      };

      shape.setScale({ x: targetScale, y: targetScale });
      shape.setPosition({
        x: shape.getX() + offset.x,
        y: shape.getY() + offset.y
      });

      ui.emit( 'view.scaled', { id: view.getId(), scale: targetScale, offset: offset });

      shape.batchDraw();
    }

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

    var $canvas = $container.find('canvas');
    $canvas
      .on( 'dragover', onDragOver )
      .on( 'drop', onFileDropRequest );

    shape.on( 'contentDblclick contentDbltap', onOpenRequest );


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
  var stage = $container.data( 'stage' );
  var scale = stage.getScale().x;
  var e = {
    clientX: evt.center && evt.center.x || evt.clientX,
    clientY: evt.center && evt.center.y || evt.clientY
  };
  var plot = plotPointer( e, stage, scale );

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

function plotPointer( evt, stage, scale ) {
  var rect = $(stage.getContainer()).find('> .kineticjs-content')[0].getBoundingClientRect();
  var stagePos = stage.getPosition();
  var width = stage.getWidth();
  var height = stage.getHeight();

  // mouse pos relative to top left corner of element
  var mouseX = evt.clientX - rect.left;
  var mouseY = evt.clientY - rect.top;

  return {
    x: ( ( stagePos.x * -1 ) + ( ( mouseX / ( rect.right - rect.left ) ) * width ) ) / scale,
    y: ( ( stagePos.y * -1 ) + ( ( mouseY / ( rect.bottom - rect.top ) ) * height ) ) / scale
  };
}

module.exports = CanvasView;
