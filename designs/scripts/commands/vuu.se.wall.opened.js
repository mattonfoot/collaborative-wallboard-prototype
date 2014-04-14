define(function() {

    function initialize( app ) {
        app.queue.on( app, 'wall:opened', populateWall );

        // handlers

        function populateWall( data ) {
            var wall = app.getWallById( data.id )
              , id = wall.id;

            $.get('/walls/' + id + '/boards')
                .done(function( data ) {
                    data.boards && data.boards.forEach(function( resource ) {
                        app.queue.trigger( app, 'board:created', resource );
                    });
                })
                .fail(function( error ) {
                    throw( error );
                });

            $.get('/walls/' + id + '/pockets')
                .done(function( data ) {
                    data.pockets && data.pockets.forEach(function( resource ) {
                        app.queue.trigger( app, 'pocket:created', resource );
                    });
                })
                .fail(function( error ) {
                  throw( error );
                });

            app.enableControls();
        }
    }

    return {
      initialize: initialize
    };

});
