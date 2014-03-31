
// event <-- canvascard:opened

// event -->

define(function() {

function initialize( app ) {
    app.queue.on( app, 'canvasregion:opened', displayRegionData);

    function displayRegionData( data ) {
        var region = data.region;

        var name = region.name || "";
        var value = region.value || "";
        var color = region.color || "";

        $('<div class="modal fade"> \
            <div class="modal-dialog"> \
              <div class="modal-content"> \
                <div class="modal-header"> \
                  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                  <h4 class="modal-title">REGION: ' + name + '</h4> \
                </div> \
                <div class="modal-body"> \
                  <dl class="dl-horizontal"> \
                      <dt>Value</dt> \
                      <dd>' + value + '</dd> \
                      <dt>Color</dt> \
                      <dd>' + color + '</dd> \
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
