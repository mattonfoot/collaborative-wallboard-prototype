
// event <-- region:updated

// event -->

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'region:updated', updateRegion );

        // handlers

        function updateRegion( data ) {
          var board, region;

          if ( board = app.wall.getBoardById( data.links.board ) ) {
              if (region = board.getRegionById( data.id ) ) {

              }
          }
        }
    }

    return {
        initialize: initialize
    };

});
