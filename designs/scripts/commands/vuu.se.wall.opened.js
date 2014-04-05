
// event <-- wall:opened

// event --> wall:displayed, board:opened, pocket:added

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
                    if ( app.addBoard( resource ) ) {
                        var board = app.getBoardById( resource.id );

                        app.queue.trigger( app, 'board:added', board );
                    }
                });
            })
            .fail(function( error ) {
                throw( error );
            });

        $.get('/walls/' + id + '/pockets')
            .done(function( data ) {
                data.pockets && data.pockets.forEach(function( resource ) {
                    if ( app.addPocket( resource ) ) {
                        var pocket = app.getPocketById( resource.id );

                        app.queue.trigger( app, 'pocket:added', pocket );
                    }
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
