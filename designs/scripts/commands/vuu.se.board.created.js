
// event <-- board:created

// event --> board:cloned, board:added, region:created, pocket:created

define([ 'models/vuu.se.board' ], function( Board ) {

function initialize( app ) {
    app.queue.on( app, 'board:created', cloneBoard );
    app.queue.on( app, 'board:opened', cloneBoard );

    // handlers

    function cloneBoard( data ) {
        var wall = app.wall
          , board = new Board( app.queue, data )
          , id = board.getId();

        app.element.find( '.tab-content' ).append( '<div class="tab-pane" id="'+ id +'"></div>' );

        app.queue.trigger( board, 'board:cloned', { board: board } );

        if ( wall.addBoard( board ) ) {
            app.queue.trigger( app, 'board:added', { wall: wall, board: board } );

            app.element.find( '.tab-content > .active, .nav-tabs > .active' ).removeClass( 'active' );
            app.element.find( '.tab-content #' + id ).addClass( 'active' );

            $.get('/boards/' + id + '/regions')
                .done(function( data ) {
                    data.regions && data.regions.forEach(function( region ) {
                        app.queue.trigger( app, 'region:created', region ); // fake the server event
                    });
                })
                .fail(function() {
                    alert( "error" );
                })
                .always(function() {
                    $.get('/walls/' + wall.id + '/pockets')
                        .done(function( data ) {
                            data.pockets && data.pockets.forEach(function( pocket ) {
                                if (!!wall.getPocketById( pocket.id )) {
                                    return app.queue.trigger( app, 'pocket:added', pocket );
                                }

                                app.queue.trigger( app, 'pocket:created', pocket ); // fake the server event
                            });
                        })
                        .fail(function() {
                            alert( "error" );
                        });
                });
        }
    }
}

return {
    initialize: initialize
};

});
