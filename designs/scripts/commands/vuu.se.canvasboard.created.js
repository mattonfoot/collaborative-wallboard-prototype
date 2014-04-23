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

            app.registerCanvasBoard( canvasboard );

            app.queue.trigger( app, 'canvasboard:created', canvasboard );
        }

        app.queue.on( app, 'canvasboard:created', createCanvasCard );

        // handlers

        function createCanvasCard( canvasboard ) {
            var cardsOnBoard = [];

            app.queue.on( app, 'card:cloned', addCanvasCard);

            // handlers

            function addCanvasCard( data ) {
                var card = app.getCardById( data.id );

                if ( ~cardsOnBoard.indexOf( card.getId() ) ) {
                    return false;
                }

                if ( card.getBoard() == canvasboard.getId() ) {
                    var canvascard = new CanvasCard( app.queue, card, app.getPocketById( card.getPocket() ) );

                    app.queue.trigger( app, 'canvascard:created', canvascard );

                    canvasboard.addCard( canvascard );

                    cardsOnBoard.push( card.getId() );

                    app.queue.trigger( app, 'canvascard:added', canvascard );
                }
            }
        }


        app.queue.on( app, 'canvasboard:created', createCanvasRegion );

        // handlers

        function createCanvasRegion( canvasboard ) {
            var regionsOnBoard = [];

            app.queue.on( app, 'region:cloned', addCanvasRegion);

            // handlers

            function addCanvasRegion( data ) {
                var region = app.getRegionById( data.id );

                if ( ~regionsOnBoard.indexOf( region.getId() ) ) {
                    return false;
                }

                if ( region.getBoard() == canvasboard.getId() ) {
                    var canvasregion = new CanvasRegion( app.queue, region );

                    app.queue.trigger( app, 'canvasregion:created', canvasregion );

                    canvasboard.addRegion( canvasregion );

                    regionsOnBoard.push( region.getId() );

                    app.queue.trigger( app, 'canvasregion:added', canvasregion );
                }
            }
        }
    }

    return {
        initialize: initialize
    };

});
