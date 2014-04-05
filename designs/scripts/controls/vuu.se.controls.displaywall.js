
define(function() {

    function initialize( app ) {
        app.element.on( 'mouseup touchend', '.list-group-item', triggerDisplayWall );

        function triggerDisplayWall( e ) {
            e.preventDefault();

            var target = $( e.target ).data( 'target' )
              , wall = app.activewall = app.getWallById( target );

            app.queue.trigger( app, 'wall:selected', wall );

            $( '#wallModal' ).modal( 'hide' );
        }
    }

    return {
        initialize: initialize
    };

});
