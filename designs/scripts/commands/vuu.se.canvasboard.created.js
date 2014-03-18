
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
            var canvasboard = new CanvasBoard( app.queue, { container: id, width: app.size.width, height: app.size.height } );

            // triggers

            app.queue.on( canvasboard, 'card:cloned', addCanvasCard);

            app.queue.on( canvasboard, 'region:cloned', addCanvasRegion);

            // handlers

            function addCanvasCard( data ) {
                if ( data.card.links.board == id ) {
                    var canvascard = new CanvasCard( app.queue, data.card, app.wall.getPocketById( data.card.links.pocket ) );

                    canvasboard.addCard( canvascard );
                }
            }

            function addCanvasRegion( data ) {
                if ( data.region.links.board == id ) {
                    var canvasregion = new CanvasRegion( app.queue, data.region );

                    canvasboard.addRegion( canvasregion );
                }
            }

            app.queue.trigger( app, 'canvasboard:created', canvasboard );
        }
    }

    return {
        initialize: initialize
    };

});
