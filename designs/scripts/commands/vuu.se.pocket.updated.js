define(function() {

    function initialize( app ) {
        app.queue.on( app, 'pocket:updated', updatePocket );

        // handlers

        function updatePocket( data ) {
          app.updatePocket( data );
        }
    }

    return {
        initialize: initialize
    };

});
