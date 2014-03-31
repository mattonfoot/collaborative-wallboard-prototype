
// event <-- canvascard:opened

// event -->

define(function() {

function initialize( app ) {
    var queue = app.queue;

    queue.on( app, 'canvascard:opened', displayPocketData);

    function displayPocketData( data ) {
        var pocket = data.pocket;

        var html = '';
        var content = pocket.content || "";
        var tags = pocket.tags || "";
        var mentions = pocket.mentions || "";

        $.get('/pockets/' + pocket.id + '/regions')
            .done(function( data ) {
                data.regions && data.regions.forEach(function( region ) {
                    var board = app.wall.getBoardById( region.links.board );

                    html += '<dt>'+ board.getKey() + '</dt><dd>' + region.value + '</dd>';
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
                          <h4 class="modal-title">CARD: [#' + pocket.cardnumber + '] ' + pocket.title + '</h4> \
                        </div> \
                        <div class="modal-body"> \
                          ' + content + ' \
                          <hr/> \
                          <h5>Additional data</h5> \
                          <dl class="dl-horizontal"> \
                              ' + html + ' \
                          </dl> \
                          <hr/> \
                          <h5>Tags</h5> \
                          <p>' + tags + '</p> \
                          <hr/> \
                          <h5>Mentions</h5> \
                          <p>' + mentions + '</p> \
                        </div> \
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
