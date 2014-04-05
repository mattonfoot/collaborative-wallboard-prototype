define(function() {

    function initialize( app ) {
        app.queue.on( app, 'card:created', cloneCard );

        // handlers

        function cloneCard( data ) {
            var card = app.getCardById( data.id );

            if ( !card && app.addCard( data ) ) {
                card = app.getCardById( data.id );
            }

            if ( !card ) {
                throw( 'Failed to clone card <'+ data.id +'> from data' );
            }

            var board = app.getBoardById( card.getBoard() );

            if ( board && board.addCard( card ) ) {
                app.queue.trigger( app, 'card:added', card );
            }

            app.queue.trigger( app, 'card:cloned', card );
        }
    }

    return {
        initialize: initialize
    };

});
