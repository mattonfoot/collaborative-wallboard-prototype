define([
      'shapes/vuu.se.canvas.board',
      'shapes/vuu.se.canvas.card',
      'shapes/vuu.se.canvas.region'
  ], function( CanvasBoard, CanvasCard, CanvasRegion ) {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', createCanvasBoard );

        // handlers

        function createCanvasBoard( data ) {
            var board = app.getBoardById( data.id )
              , id = board.id
              , canvasboard = new CanvasBoard( app.queue, board, { container: id, width: app.size.width, height: app.size.height } );

            app.queue.trigger( app, 'canvasboard:created', canvasboard );

            // the following should be triggered by canvasboard:created

            // triggers

            app.queue.on( app, 'card:cloned', addCanvasCard);

            app.queue.on( app, 'region:cloned', addCanvasRegion);

            // handlers

            function addCanvasCard( data ) {
                var card = app.getCardById( data.id );

                if ( card.getBoard() == id ) {
                    var canvascard = new CanvasCard( app.queue, card, app.getPocketById( card.getPocket() ) );

                    app.queue.trigger( app, 'canvascard:created', canvascard );

                    canvasboard.addCard( canvascard );

                    app.queue.trigger( app, 'canvascard:added', canvascard );
                }
            }

            function addCanvasRegion( data ) {
                var region = app.getRegionById( data.id );

                if ( region.getBoard() == id ) {
                    var canvasregion = new CanvasRegion( app.queue, region );

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
