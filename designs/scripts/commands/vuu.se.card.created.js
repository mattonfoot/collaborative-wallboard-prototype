
// event <-- card:created

// event --> card:cloned, card:added, card:moved

define([ 'models/vuu.se.card' ], function( Card ) {

function initialize( app ) {
    app.queue.on( app, 'card:created', cloneCard );

    // handlers

    function cloneCard( data ) {
      var boardid = (data.board ? data.board.id : data.links.board );
      var board = app.wall.getBoardById( boardid );

      if ( board.getCardById( data.id ) ) {
        return; // we already have it ( should we check if it's fully synced? )
      }

      var card = new Card( queue, data );

      app.queue.trigger( card, 'card:cloned', { card: card } );

      if ( board.addCard( card ) ) {
          app.queue.trigger( board, 'card:added', { board: board, card: card } );

          app.queue.trigger( card, 'card:moved', { card: card });
      }
    }
}

return {
    initialize: initialize
};

});
