define([ 'kinetic' ], function() {

    var CanvasBoard  = (function() {

        // defaults

        var min_scale = 0.1;

        // constructor

        function CanvasBoard( queue, board, options ) {
            var shape = new Kinetic.Stage({
                container: options.container,
                id: board.id,
                width: options.width,
                height: options.height,
                draggable: true
            });

            shape.regions = new Kinetic.Layer();
            shape.add( shape.regions );

            shape.cards = new Kinetic.Layer();
            shape.add( shape.cards );

            // triggers

            shape
                .on( 'dblclick', function( ev ) {
                    queue.trigger( shape, 'canvasboard:opened', { board: board } );

                    ev.cancelBubble = true;
                });

            var $container = $( '#' + options.container );
            var scale = 1;
            var zoomFactor = 1.1;
            var origin = { x: 0, y: 0 };

            $container
              .bind('mousewheel', function( e ) {
                  var evt = e.originalEvent,
                      mx = evt.clientX /* - canvas.offsetLeft */,
                      my = evt.clientY /* - canvas.offsetTop */,
                      delta = evt.wheelDelta;

                  //prevent only the actual wheel movement
                  if (delta !== 0) {
                      e.preventDefault();
                  }

                  var cur_scale = scale * (zoomFactor - (delta < 0 ? 0.2 : 0));

                  if (cur_scale > min_scale) {
                      origin.x = mx / scale + origin.x - mx / cur_scale;
                      origin.y = my / scale + origin.y - my / cur_scale;

                      shape.offset({ x: origin.x, y: origin.y });
                      shape.scale( { x: cur_scale, y: cur_scale });
                      shape.batchDraw();

                      scale = cur_scale;

                      queue.trigger( shape, 'canvasboard:scaled', { canvasboard: shape, scale: scale });
                  }
              });

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
        };

        // Factory

        return CanvasBoard ;

    })();

    // export

    return CanvasBoard;

});
