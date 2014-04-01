
// event <-- wall:opened

// event --> wall:displayed, board:created, pocket:created

define(function() {

function initialize( app ) {
    app.queue.on( app, 'wall:opened', cloneWall );

    // handlers

    function cloneWall( wall ) {
      app.wall = wall;

      app.element.data('wall', wall);

      app.queue.trigger( app, 'wall:displayed', { wall: app.wall } );

      $.get('/walls/' + app.wall.id + '/boards')
          .done(function( data ) {
              data.boards && data.boards.forEach(function(board) {
                  app.queue.trigger( app, 'board:opened', board );
              });

              $.get('/walls/' + app.wall.id + '/pockets')
                  .done(function( data ) {
                      data.pockets && data.pockets.forEach(function(pocket) {
                          app.queue.trigger( app, 'pocket:added', pocket ); // fake the server event
                      });
                  })
                  .fail(function() {
                    alert( "error" );
                  });
          })
          .fail(function() {
              app.queue.trigger( app, 'wall:firsttime', {} );
          });
    }
}

return {
  initialize: initialize
};

});
