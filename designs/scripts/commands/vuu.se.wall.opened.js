
// event <-- wall:opened

// event --> wall:displayed, board:opened, pocket:added

define(function() {

function initialize( app ) {
    app.queue.on( app, 'wall:selected', cloneWall );

    // handlers

    function cloneWall( wall ) {
        $.get('/walls/' + wall.id + '/boards')
            .done(function( data ) {
                data.boards && data.boards.forEach(function(board) {
                    app.queue.trigger( app, 'board:opened', board );
                });
            })
            .fail(function() {
                alert( "error" );
            });

        $.get('/walls/' + wall.id + '/pockets')
            .done(function( data ) {
                data.pockets && data.pockets.forEach(function(pocket) {
                    app.queue.trigger( app, 'pocket:added', pocket ); // fake the server event
                });
            })
            .fail(function() {
              alert( "error" );
            });
    }
}

return {
  initialize: initialize
};

});
