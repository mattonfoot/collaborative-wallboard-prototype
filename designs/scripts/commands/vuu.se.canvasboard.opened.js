define(function() {

    function initialize( app ) {
        app.queue.on( app, 'canvasboard:opened', displayBoardData);

        function displayBoardData( data ) {
            var board = app.getBoardById( data.board.id );

            var name = board.getName() || "";
            var key = board.getKey() || "";
            var transform = board.getTransform() || "";

            $('<div class="modal fade"> \
                <div class="modal-dialog"> \
                  <div class="modal-content"> \
                    <div class="modal-header"> \
                      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                      <h4 class="modal-title">BOARD: ' + name + '</h4> \
                    </div> \
                    <div class="modal-body"> \
                      <dl class="dl-horizontal"> \
                          <dt>Key</dt> \
                          <dd>' + key + '</dd> \
                          <dt>Transform</dt> \
                          <dd>' + transform + '</dd> \
                      </dl> \
                    </div> \
                    <div class="modal-footer"> \
                      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
                    </div> \
                  </div> \
                </div> \
              </div>').appendTo('body').modal('show');
        }
    }

    return {
      initialize: initialize
    };

});
