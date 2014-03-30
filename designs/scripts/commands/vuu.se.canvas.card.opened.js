
// event <-- canvascard:opened

// event -->

define(function() {

function initialize( app ) {
    var queue = app.queue;

    queue.on( app, 'canvascard:opened', displayPocketData);

    function displayPocketData( data ) {
        var pocket = data.pocket;

        var html = '';

        $.get('/pockets/' + pocket.id + '/regions')
            .done(function( data ) {
                data.regions && data.regions.forEach(function( region ) {
                    var board = app.wall.getBoardById( region.links.board );

                    html += '<tr><th>'+ board.getKey() + '</th><td>' + region.value + '</td></tr>';
                });
            })
            .fail(function() {
                alert( "error" );
            })
            .always(function() {
                $('<div class="modal fade"> \
                    <div class="modal-dialog"> \
                      <div class="modal-content"> \
                        <div class="modal-header"> \
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                          <h4 class="modal-title">[#' + pocket.cardnumber + '] ' + pocket.title + '</h4> \
                        </div> \
                        <div class="modal-body"><table class="table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>' + html + '</tbody></table></div> \
                        <div class="modal-footer"> \
                          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
                        </div> \
                      </div> \
                    </div> \
                  </div>').appendTo('body').modal('show');

            });
    }
}

return {
  initialize: initialize
};

});
