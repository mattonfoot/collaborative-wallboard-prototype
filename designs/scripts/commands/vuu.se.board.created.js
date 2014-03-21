
// event <-- board:created

// event --> board:cloned, board:added, region:created, pocket:created

define([ 'models/vuu.se.board' ], function( Board ) {

function initialize( app ) {
    app.queue.on( app, 'board:created', cloneBoard );

    // handlers

    function cloneBoard( data ) {
      var wall = app.wall
        , board = new Board( app.queue, data )
        , id = board.getId();

      app.element.find( '.tab-content' ).append( '<div class="tab-pane" id="'+ id +'"></div>' );

      app.queue.trigger( board, 'board:cloned', { board: board } );

      if ( wall.addBoard( board ) ) {

        app.element.find( '.tab-content > .active, .nav-tabs > .active' ).removeClass( 'active' );
        app.element.find( '.tab-content #' + id ).addClass( 'active' );

        app.queue.trigger( app, 'board:added', { wall: wall, board: board } );

        // clone the regions

        var regions = data.links.regions || [];
        regions.forEach(function( id ) {
          $.get('/regions/' + id, function( resources ) {
            resources.regions.forEach(function( region ) {
              if ( region.links.board == board.id ) {
                  app.queue.trigger( app, 'region:created', region ); // faked by this module
              }
            });
          });
        });

        // create cards for existing pockets

        wall.links.pockets.forEach(function( pocket ) {
          $.get('/pockets/' + id, function( pocket ) {
            resources.pockets.forEach(function( pocket ) {
              if ( pocket.links.wall == wall.id ) {
                  app.queue.trigger( app, 'pocket:created', pocket ); // faked by this module
              }
            });
          });
        });
      }
    }
}

return {
    initialize: initialize
};

});
