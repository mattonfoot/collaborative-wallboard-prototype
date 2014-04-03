
// event <-- canvascard:opened

// event -->

define(function() {

    function initialize( app ) {
        var queue = app.queue;

        queue.on( app, 'canvascard:opened', displayPocketData);

        function displayPocketData( data ) {
            var pocket = data.pocket;

            var $modal = $('<div class="modal fade"></div>')
              .on('submit', '.editor-pocket', function( ev ) {
                ev.preventDefault();

                pocket.title = this.title.value;
                pocket.content = this.content.value;
                pocket.tags = this.tags.value;
                pocket.mentions = this.mentions.value;
                pocket.wall = pocket.links.wall;
                pocket.cards = pocket.links.cards;
                pocket.regions = pocket.links.regions;

                $.ajax({
                    url: '/pockets/' + pocket.id,
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "PUT",
                    data: JSON.stringify( { pockets: [ pocket ] } )
                });

                $modal.modal('hide');
              });

            $modal.appendTo('body').modal({ remote: '/pockets/' + pocket.id + '/edit' });
        }
    }

    return {
        initialize: initialize
    };

});
