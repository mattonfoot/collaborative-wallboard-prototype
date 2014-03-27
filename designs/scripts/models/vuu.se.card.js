
// event <-- canvascard:moved, card:updated

// event --> card:moved, card:tagged, card:untagged

define(function() {

    var Card = (function() {

        function Card( queue, data ) {
            var card = this;

            card.id = data.id;
            card.links = data.links || {};
            card.x = data.x;
            card.y = data.y;
            card.width = 100;
            card.height = 65;
            card.tagged = data.tagged || '';

            // triggers

            queue
              .on( card, 'canvascard:moved', function( data ) {
                if ( card.id === data.card.id &&
                    ( card.x != data.x || card.y != data.y ) ) {
                  __moveTo( data.x, data.y );
                }
              })
              .on( card, 'card:moved', function( data ) {
                if ( card.id === data.id &&
                    ( card.x != data.x || card.y != data.y ) ) {
                  __moveTo( data.x, data.y );
                }
              })
              .on( card, 'card:updated', function( data ) {
                if ( card.id === data.id &&
                    ( card.x != data.x || card.y != data.y ) ) {
                  __moveTo( data.x, data.y );
                }
              });

            // private

            function __moveTo( x, y ) {
              card.x = x;
              card.y = y;
            }

            // public functions

            card.getId = function() {
              return card.id;
            };

            card.getPocketId = function() {
              return card.links.pocket;
            };

            card.getBoardId = function() {
              return card.links.board;
            };

            card.getPosition = function() {
              return {
                board: card.getBoardId(),
                x: card.x,
                y: card.y
              };
            };

            card.tag = function( color ) {
                card.tagged = color;

                queue.trigger( card, 'card:tagged', { card: card } );

                return card;
            };

            card.untag = function() {
                card.tagged = false;

                queue.trigger( card, 'card:untagged', { card: card } );

                return card;
            };

            // instance

            return card;
        }

        // Factory

        return Card;

    })();

    // export

    return Card;

});
