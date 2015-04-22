// defaults

var min_scale = 0.1;

// constructor

function CanvasBoard( queue, board, options ) {
    var shape = new Kinetic.Stage({
        container: board.getId(),
        width: options.width,
        height: options.height,
        draggable: true
    });

    shape.regions = new Kinetic.Layer();
    shape.add( shape.regions );

    shape.cards = new Kinetic.Layer();
    shape.add( shape.cards );

    // triggers
    shape.on( 'contentDblclick contentDbltap', onOpenRequest );

    var $container = $( '#' + options.container );
    var scale = 1;
    var zoomFactor = 1.1;
    var origin = { x: 0, y: 0 };

    $container.on('mousewheel', onZoomRequest);

    // private methods

    function onOpenRequest( e ) {
        if (shape.preventEvents) {
            shape.preventEvents = false;

            return;
        }

        queue.publish( 'board:edit', board.getId() );
    }

    function onZoomRequest( e ) {
        var evt = e.originalEvent,
            mx = evt.clientX /* - canvas.offsetLeft */,
            my = evt.clientY /* - canvas.offsetTop */,
            delta = evt.wheelDelta;

        //prevent only the actual wheel movement
        stopMouseWheelPropogation( evt );

        var cur_scale = scale * (zoomFactor - (delta < 0 ? 0.2 : 0));

        if (cur_scale <= min_scale) return;

        origin.x = mx / scale + origin.x - mx / cur_scale;
        origin.y = my / scale + origin.y - my / cur_scale;

        scale = cur_scale;

        queue.publish( 'board:scale', { id: board.getId(), scale: scale });

        shape.offset({ x: origin.x, y: origin.y });
        shape.scale( { x: cur_scale, y: cur_scale });
        shape.batchDraw();

        queue.publish( 'board:scaled', { id: board.getId(), scale: scale });
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

    // instance

    return shape;
}

function stopMouseWheelPropogation( evt ) {
    if (evt.wheelDelta === 0) return;

    evt.preventDefault();
}

module.exports = CanvasBoard;
