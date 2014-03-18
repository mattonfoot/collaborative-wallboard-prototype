
// event <-- wall:opened

// event --> wall:displayed, board:created, pocket:created

define([ 'models/vuu.se.wall' ], function( Wall ) {

function initialize( app ) {
    app.queue.on( app, 'wall:opened', cloneWall );

    // handlers

    function cloneWall( data ) {
      data.links = data.links || {};

      app.wall = new Wall( app.queue, data );

      app.element.data('wall', app.wall);

      app.queue.trigger( app, 'wall:displayed', { wall: app.wall } );

      var boards = data.links.boards || [];
      boards.forEach( function( id ) {
        $.get('/boards/' + id, function( data ) {
          if ( data.boards && data.boards[0] ) {
            app.queue.trigger( app, 'board:created', data.boards[0] ); // fake the server event
          }
        });
      });

      var pockets = data.links.pockets || [];
      pockets.forEach( function( id ) {
        $.get('/pockets/' + id, function( data ) {
          if ( data.pockets && data.pockets[0] ) {
            app.queue.trigger( app, 'pocket:created', data.pockets[0] ); // fake the server event
          }
        });
      });
    }
}

return {
  initialize: initialize
};

});
