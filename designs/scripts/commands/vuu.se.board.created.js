define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:created', cloneBoard );
        app.queue.on( app, 'board:added', cloneBoard );

        // handlers

        function cloneBoard( data ) {
            if ( app.addPocket( data ) ) {
                var board = app.getBoardById( data.id )
                  , wall = app.getWallById( board.wall );

                app.tabcontent.append( '<div class="tab-pane" id="'+ board.id +'"></div>' );

                app.queue.trigger( app, 'board:cloned', board );

                if ( wall.addBoard( board ) ) {
                    app.queue.trigger( app, 'board:added', board );

                    app.tabs.find( '#' + board.id ).addClass( 'active' );
                }
            }
        }
    }

    return {
        initialize: initialize
    };

});
