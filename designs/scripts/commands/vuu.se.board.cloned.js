
define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', cloneBoard );

        // handlers

        function cloneBoard( data ) {
            var board = app.getBoardById( data.id );

            $.get('/boards/' + board.id + '/regions')
                .done(function( data ) {
                    data.regions && data.regions.forEach(function( resource ) {
                        app.queue.trigger( app, 'region:created', resource ); // fake the server event
                    });
                })
                .fail(function( error ) {
                    throw( error );
                });

            var wall = app.getWallById( board.wall );

            $.get('/walls/' + wall.id + '/pockets')
                .done(function( data ) {
                    data.pockets && data.pockets.forEach(function( resource ) {
                        app.queue.trigger( app, 'pocket:created', resource );
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
