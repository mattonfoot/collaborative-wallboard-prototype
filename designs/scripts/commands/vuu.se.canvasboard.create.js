
// event <-- board:cloned, card:cloned, region:cloned

// event -->

define(function() {

function initialize( app ) {
    var queue = app.queue;

    queue.on( app, 'board:cloned', createCanvasBoard );

    // handlers

    function createCanvasBoard( data ) {
      var id = board.id;
      var canvasboard = new CanvasBoard(queue, { container: id, width: app.size.width, height: app.size.height });

      // triggers

      queue.on( canvasboard, 'card:cloned', addCanvasCard);

      queue.on( canvasboard, 'region:cloned', addCanvasRegion);

      // handlers

      function addCanvasCard( data ) {
        if ( data.card.links.board == id ) {
          var canvascard = new CanvasCard( queue, data.card, app.wall.getPocketById( data.card.links.pocket ) );

          canvasboard.addCard( canvascard );
        }
      }

      function addCanvasRegion( data ) {
        if ( data.region.links.board == id ) {
          var canvasregion = new CanvasRegion( queue, data.region );

          canvasboard.addRegion( canvasregion );
        }
      }

      queue.trigger( app, 'canvasboard:created', canvasboard );
    }
}

return {
    initialize: initialize
};

});
