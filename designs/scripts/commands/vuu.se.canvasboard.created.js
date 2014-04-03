
// event <-- board:cloned, card:cloned, region:cloned

// event --> canvasboard:created

define([
      'shapes/vuu.se.canvas.board',
      'shapes/vuu.se.canvas.card',
      'shapes/vuu.se.canvas.region'
  ], function( CanvasBoard, CanvasCard, CanvasRegion ) {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', createCanvasBoard );

        // handlers

        function createCanvasBoard( data ) {
            var id = data.board.id;
            var canvasboard = new CanvasBoard( app.queue, data.board, { container: id, width: app.size.width, height: app.size.height } );

            app.queue.trigger( app, 'canvasboard:created', canvasboard );

            // the following should be triggered by canvasboard:created

            // triggers

            app.queue.on( app, 'card:added', addCanvasCard);

            app.queue.on( app, 'region:added', addCanvasRegion);

            // handlers

            function addCanvasCard( data ) {
                if ( data.card.links.board == id ) {
                    var canvascard = new CanvasCard( app.queue, data.card, app.wall.getPocketById( data.card.links.pocket ) );

                    app.queue.trigger( app, 'canvascard:created', canvascard );

                    canvasboard.addCard( canvascard );

                    app.queue.trigger( app, 'canvascard:added', canvascard );
                }
            }

            function addCanvasRegion( data ) {
                if ( data.region.links.board == id ) {
                    var canvasregion = new CanvasRegion( app.queue, data.region );

                    app.queue.trigger( app, 'canvasregion:created', canvasregion );

                    canvasboard.addRegion( canvasregion );

                    app.queue.trigger( app, 'canvasregion:added', canvasregion );
                }
            }
        }
    }

    return {
        initialize: initialize
    };

});
