
// event <-- region:created

// event --> region:cloned, board:added

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'region:created', createRegion );

        // handlers

        function createRegion( data ) {
          var board = app.wall.getBoardById( data.links.board );

          var region = new Region( queue, data );

          app.queue.trigger( region, 'region:cloned', { region: region } );

          if ( board.addRegion( region ) ) {
              app.queue.trigger( board, 'region:added', { board: board, region: region } );
          }
        }
    }

    return {
        initialize: initialize
    };

});
