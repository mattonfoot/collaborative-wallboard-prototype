define(function() {

    function initialize( app ) {
        var queue = app.queue;

        queue.on( app, 'pocket:cloned', cloneCards );

        // handlers

        function cloneCards( data ) {
            var pocket = app.getPocketById( data.id );

            $.get('/pockets/' + pocket.id + '/cards')
                .done(function( data ) {
                    data.cards && data.cards.forEach(function( resource ) {
                        var card = app.getCardById( resource.id );

                        if ( !card && app.addCard( resource ) ) {
                            card = app.getCardById( resource.id );
                        }

                        if ( !card ) {
                            throw( 'Failed to clone card <'+ resource.id +'> from data' );
                        }

                        var board = app.getBoardById( card.getBoard() );

                        if ( board.addCard( card ) ) {
                            app.queue.trigger( app, 'card:added', card );
                        }

                        app.queue.trigger( app, 'card:cloned', card );
                    });
                })
                .fail(function( error ) {
                    throw( error );
                });
        }
    }

    return {
        initialize: initialize
    };

});
