
// event <-- pocket:added

// event --> card:created

define(function() {

    function initialize( app ) {
        var queue = app.queue;

        queue.on( app, 'pocket:added', cloneCards );

        // handlers

        function cloneCards( data ) {
          var wall = app.wall
            , boards = wall.links.boards
            , pocket = data;

          if (pocket.links.wall == wall.id) {
              boards.forEach(function( board ) {
                $.get('/pockets/' + pocket.id + '/cards', function( resources ) {
                  resources.cards.forEach(function( card ) {
                    if ( card.links.board == board.id ) {
                        queue.trigger( app, 'card:created', card ); // faked by this module
                    }
                  });
                });
              });
          }

          return pocket;
        }
    }

    return {
        initialize: initialize
    };

});
