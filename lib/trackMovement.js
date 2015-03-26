
var cardHeight = 65;
var cardWidth = 100;

function MovementTracker( queue, commands, queries ) {
  this._queue = queue;
  this._commands = commands;
  this._queries = queries;

  this._regionalcards = {};
}

MovementTracker.prototype.trackCardMovement = function( location ) {
  var tracker = this
    , patch = {
          in: []
        , out: []
      }
    , card;

    // get the card for the location
    return tracker._queries.getPocket( location.getPocket() )
        .then(function( resource ) {
            card = resource;

            // get the board for the location
            return tracker._queries.getBoard( location.getBoard() );
        })
        .then(function( board ) {

            // get the regions for the board
            return tracker._queries.getRegionsForBoard( board );
        })
        .then(function( regions ) {
            var update = [];

            regions.forEach(function( region ) {
                var regionid = region.getId()
                  , isInRegion = cardIsInRegion( location, region )
                  , areLinked = ~card.getRegions().indexOf( regionid );

                if ( isInRegion ) {
                    if (!areLinked) {
                        patch.in.push( region ); // mark region going in
                    }

                    update.push( regionid );

                    return;
                }

                if ( areLinked ) {
                    patch.out.push( region ); // mark region comming out
                }
            });

            if ( !patch.in.length && !patch.out.length ) return card;

            card.regions = update;

            tracker._commands.updatePocket( card );

            patch.out.forEach(function( region ) {
              tracker._queue.emit( 'pocket:regionexit', { pocket: card, region: region } );
            });

            patch.in.forEach(function( region ) {
              tracker._queue.emit( 'pocket:regionenter', { pocket: card, region: region } );
            });
        });
};

MovementTracker.prototype.trackRegionMovement = function( region ) {
  var tracker = this;

  return tracker._queries.getBoard( region.getBoard() )
    .then(function( board ) {
        return tracker._queries.getCardLocationsForBoard( board );
    })
    .then(function( cards ) {
        cards.forEach(function( card ) {
            if ( !cardIsInRegion( card, region ) ) {
              markPocketAsNotInRegion( tracker, card.getPocket(), region );
            }
        });

        cards.forEach(function( card ) {
            if ( cardIsInRegion( card, region ) ) {
              markPocketAsInRegion( tracker, card.getPocket(), region );
            }
        });
    });
};

function cardIsInRegion( card, region ) {
  var cardX = (card.x + (cardWidth / 2))
    , cardY = (card.y + (cardHeight / 2))
    , inLeft = cardX > region.x
    , inRight = cardX < (region.x + region.width)
    , inTop = cardY > region.y
    , inBase = cardY < (region.y + region.height);

  return ( inLeft && inRight && inTop && inBase );
}

function markPocketAsInRegion( tracker, id, region ) {
  tracker._queries.getPocket( id )
    .then(function( card ) {
      var numregions = card.getRegions().length;

      card.addRegion( region );

      if ( card.getRegions().length === numregions ) return;

      tracker._commands.updatePocket( card );

      tracker._queue.emit( 'pocket:regionenter', { pocket: card, region: region } );
    });
}

function markPocketAsNotInRegion( tracker, id, region ) {
  tracker._queries.getPocket( id )
    .then(function( card ) {
      var numregions = card.getRegions().length;

      card.removeRegion( region );

      if ( card.getRegions().length === numregions ) return;

      tracker._commands.updatePocket( card );

      tracker.queue.emit( 'pocket:regionexit', { pocket: card, region: region } );
    });
}

module.exports = MovementTracker;
