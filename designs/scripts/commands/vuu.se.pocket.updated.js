
// event <-- pocket:created

// event --> 

define(function() {

    function initialize( app ) {
        app.queue.on( app, 'pocket:updated', updatePocket );

        // handlers

        function updatePocket( data ) {
          var pocket;

          if ( pocket = app.wall.getPocketById( data.id ) ) {

          }
        }
    }

    return {
        initialize: initialize
    };

});
