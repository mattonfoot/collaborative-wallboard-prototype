define(function() {

    function initialize( app ) {
        app.queue.on( app, 'region:updated', updateRegion );

        // handlers

        function updateRegion( data ) {
            app.updateRegion( data );
        }
    }

    return {
        initialize: initialize
    };

});
