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
                        app.queue.trigger( app, 'card:created', resource );
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
