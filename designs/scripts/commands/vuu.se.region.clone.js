define(function() {

    function initialize( app ) {
        app.queue.on( app, 'region:created', cloneRegion );

        // handlers

        function cloneRegion( data ) {
            var region = app.getRegionById( data.id );

            if ( !region && app.addRegion( data ) ) {
                region = app.getRegionById( data.id );
            }

            if ( !region ) {
                throw( 'Failed to clone region <'+ data.id +'> from data' );
            }

            var board = app.getBoardById( region.getBoard() );

            if ( board.addRegion( region ) ) {
                app.queue.trigger( app, 'region:added', region );
            }

            app.queue.trigger( app, 'region:cloned', region );
        }
    }

    return {
        initialize: initialize
    };

});
