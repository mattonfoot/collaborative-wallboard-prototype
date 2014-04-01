
// event <-- canvasregion:opened

// event -->

define(function() {

    function initialize( app ) {
        var queue = app.queue;

        queue.on( app, 'canvasregion:opened', displayRegionData);

        function displayRegionData( data ) {
            var region = data.region;

            var $modal = $('<div class="modal fade"></div>')
              .on('submit', '.editor-region', function( ev ) {
                ev.preventDefault();

                region.name = this.name.value;
                region.value = this.value.value;
                region.color = this.color.value;
                region.board = region.links.board;
                region.pockets = region.links.pockets;

                $.ajax({
                    url: '/regions/' + region.id,
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "PUT",
                    data: JSON.stringify( { regions: [ region ] } )
                });

                $modal.modal('hide');
              });

            $modal.appendTo('body').modal({ remote: '/regions/' + region.id + '/edit' });
        }
    }

    return {
        initialize: initialize
    };

});
