
// event <-- card:moved, card:updated, region:moved, region:updated

// event --> card:regionenter, card:regionexit

define(function() {

    function initialize( app ) {
        var queue = app.queue;

        var regionalcards = {};

        queue.on( app, 'card:moved', trackCardMovement);

        queue.on( app, 'card:updated', function( data ) {
            var board = app.wall.getBoardById( data.links.board );

            var card = board.getCardById( data.id );

            trackCardMovement( card );
        });

        function trackCardMovement( data ) {
          var board = app.wall.getBoardById( data.links.board );
          var regions = board.regions;
          var card = board.getCardById( data.id );

          // has the card left the regions it was in

          regions.forEach(function( region ) {
              if ( !cardIsInRegion( card, region ) ) {
                  if ( markCardAsNotInRegion( card.id, region.id ) ) {
                      var pocket = app.wall.getPocketById( card.getPocketId() );

                      pocket.set( board.key );

                      queue.trigger( board, 'card:regionexit', { board: board, card: card, region: region } );
                  }
              }
          });

          // has the card entered any new regions

          regions.forEach(function( region ) {
              if ( cardIsInRegion( card, region ) ) {
                  if ( markCardAsInRegion( card.id, region.id ) ) {
                      var pocket = app.wall.getPocketById( card.getPocketId() );

                      pocket.set( board.key, region.value );

                      queue.trigger( board, 'card:regionenter', { board: board, card: card, region: region } );
                  }
              }
          });
        }

        // check to see if any new cards have entered ??
        queue.on( app, 'region:moved', trackRegionMovement);

        queue.on( app, 'region:updated', function( data ) {
            var board = app.wall.getBoardById( data.links.board );

            var region = board.getRegionById( data.id );

            trackRegionMovement( region );
        });

        function trackRegionMovement( data ) {
          var board = app.wall.getBoardById( data.links.board );
          var cards = board.cards;
          var region = board.getRegionById( data.id );

          // has the card left the regions it was in

          cards.forEach(function( card ) {
              if ( !cardIsInRegion( card, region ) ) {
                  if ( markCardAsNotInRegion( card.id, region.id ) ) {
                      var pocket = app.wall.getPocketById( card.getPocketId() );

                      pocket.set( board.key );

                      queue.trigger( board, 'card:regionexit', { board: board, card: card, region: region } );
                  }
              }
          });

          // has the card entered any new regions

          cards.forEach(function( card ) {
              if ( cardIsInRegion( card, region ) ) {
                  if ( markCardAsInRegion( card.id, region.id ) ) {
                      var pocket = app.wall.getPocketById( card.getPocketId() );

                      pocket.set( board.key, region.value );

                      queue.trigger( board, 'card:regionenter', { board: board, card: card, region: region } );
                  }
              }
          });
        }

        function cardIsInRegion( card, region ) {
          var cardX = (card.x + (card.width / 2));
          var cardY = (card.y + (card.height / 2));

          var inLeft = cardX > region.x,
              inRight = cardX < (region.x + region.width);
              inTop = cardY > region.y;
              inBase = cardY < (region.y + region.height);

          return ( inLeft && inRight && inTop && inBase );
        };

        function markCardAsInRegion( card, region ) {
          if (!regionalcards[card]) regionalcards[card] = [];

          if ( regionalcards[card].indexOf( region ) < 0 ) {
            regionalcards[card].push( region );

            return true;
          }

          return false;
        }

        function markCardAsNotInRegion( card, region ) {
          if (!regionalcards[card]) regionalcards[card] = [];

          if ( regionalcards[card].indexOf( region ) < 0 ) return false;

          regionalcards[card].splice( regionalcards[card].indexOf( region ), 1);

          return true;
        }
    }

    return {
        initialize: initialize
    };

});
