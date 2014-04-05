
define(function() {

    function initialize( app ) {
        app.queue.on( app, 'board:cloned', cloneBoard );

        // handlers

        function cloneBoard( data ) {
            var board = app.getBoardById( data.id );

            $.get('/boards/' + board.id + '/regions')
                .done(function( data ) {
                    data.regions && data.regions.forEach(function( resource ) {
                        if ( app.addRegion( resource ) ) {
                            var region = app.getRegionById( resource.id );

                            if ( board.addRegion( region ) ) {
                                return app.queue.trigger( app, 'region:added', region );
                            }

                            app.queue.trigger( app, 'region:created', region ); // fake the server event
                        }
                    });
                })
                .fail(function( error ) {
                    throw( error );
                });

            var wall = app.getWallById( board.wall );

            $.get('/walls/' + wall.id + '/pockets')
                .done(function( data ) {
                    data.pockets && data.pockets.forEach(function( resource ) {
                        if ( app.addPocket( resource ) ) {
                            var pocket = app.getPocketById( resource.id );

                            if ( wall.addPocket( pocket ) ) {
                                return app.queue.trigger( app, 'pocket:added', pocket );
                            }

                            app.queue.trigger( app, 'pocket:created', pocket );
                        }
                    });
                })
                .fail(function( error ) {
                    throw( error );
                });
        }
    }

    return {
        initialize: initialize
    };

});
