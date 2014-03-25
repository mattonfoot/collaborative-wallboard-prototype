
// event <-- pocket:created

// event --> pocket:cloned, pocket:added

define([ 'models/vuu.se.pocket' ], function( Pocket ) {

    function initialize( app ) {
        app.queue.on( app, 'pocket:created', clonePocket );

        // handlers

        function clonePocket( data ) {
          var wall = app.wall;

          if ( wall.getPocketById( data.id ) ) {
              return; // we already have it ( should we check if it's fully synced? )
          }

          var pocket = new Pocket( app.queue, data );

          app.queue.trigger( wall, 'pocket:cloned', { pocket: pocket } );

          if ( wall.addPocket( pocket ) ) {
              app.queue.trigger( wall, 'pocket:added', pocket );
          }
        }
    }

    return {
        initialize: initialize
    };

});
