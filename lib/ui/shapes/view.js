// defaults

var min_scale = 0.1;

// constructor

function CanvasView( queue, ui, view, options ) {
    var shape = new Kinetic.Stage({
        container: view.getId(),
        width: options.width,
        height: options.height,
        draggable: true
    });

    shape.regions = new Kinetic.Layer();
    shape.add( shape.regions );

    shape.cards = new Kinetic.Layer();
    shape.add( shape.cards );

    // triggers
    var $container = $( '#' + view.getId() );
    $container
      .on("mousewheel", function( e ) {
        var evt = e.originalEvent,
            mx = evt.clientX,
            my = evt.clientY,
            delta = evt.wheelDelta;

        stopMouseWheelPropogation( evt );

        if ( e.ctrlKey ) {
          onZoomRequest( mx, my, delta );
          return;
        }

        onPanRequest( evt, 'mousewheel' );
      });

    var $canvas = $container.find('canvas');
    $canvas
      .on( 'dragover', onDragOver )
      .on( 'drop', onFileDropRequest )
      .on( 'gestureend', function( ev ) {
        if ( ev.scale < 1.0) {
          console.log( 'zoom in detected' );
        } else if ( ev.scale > 1.0) {
          console.log( 'zoom out detected' );
        }
      });


    shape.on( 'contentDblclick contentDbltap', onOpenRequest );

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

    var scale = 1;
    var zoomFactor = 1.1 ;
    var scrollFactor = .5; //1.1;
    var origin = { x: 0, y: 0 };
    function onZoomRequest( mx, my, delta ) {
      var cur_scale = scale * (zoomFactor - (delta < 0 ? 0.2 : 0));

      if (cur_scale <= min_scale) return;

      origin.x = mx / scale + origin.x - mx / cur_scale;
      origin.y = my / scale + origin.y - my / cur_scale;

      scale = cur_scale;

      ui.emit( 'view.scale', { id: view.getId(), scale: scale });

      shape.offset({ x: origin.x, y: origin.y });
      shape.scale( { x: cur_scale, y: cur_scale });
      shape.batchDraw();

      ui.emit( 'view.scaled', { id: view.getId(), scale: scale });
    }

    function onPanRequest( evt ) {
      shape.pan({
        x: shape.getX() + ( evt.wheelDeltaX * scrollFactor ),
        y: shape.getY() + ( evt.wheelDeltaY * scrollFactor )
      });
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

      shape.regions.batchDraw();
      shape.cards.batchDraw();
    };

    shape.pan = function( loc ) {
      shape.setX( loc.x );
      shape.setY( loc.y );

      shape.regions.batchDraw();
      shape.cards.batchDraw();
    };

    // instance

    return shape;
}

function stopMouseWheelPropogation( evt ) {
    if ( evt.wheelDelta === 0 ) return;

    evt.preventDefault();
}

module.exports = CanvasView;
