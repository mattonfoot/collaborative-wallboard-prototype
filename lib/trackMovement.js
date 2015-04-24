
var cardHeight = 65;
var cardWidth = 100;

function MovementTracker( queue, queries ) {
  var movementTracker = this;
  this._queue = queue;
  this._queries = queries;

  this._regionalcards = {};

  queue.subscribe( 'card.moved', function( data ) {
    queries.getCardLocation( data.card, data.board )
      .then(function( location ) {
        location.x = data.x;
        location.y = data.y;

        movementTracker.trackCardMovement( location );
      });
  });

  queue.subscribe( 'region.moved', function( data ) {
    queries.getRegion( data.id )
      .then(function( region ) {
        region.x = data.x;
        region.y = data.y;

        movementTracker.trackRegionMovement( region );
      });
  });
}

MovementTracker.prototype.trackCardMovement = function( location ) {
  var queue = this._queue;
  var queries = this._queries;

  var patch = { in: [], out: [] };
  var card;

  // get the card for the location
  return queries.getPocket( location.getPocket() )
    .then(function( resource ) {
        card = resource;

        return queries.getBoard( location.getBoard() );
    })
    .then(function( board ) {
        return queries.getRegionsForBoard( board );
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

      patch.out.forEach(function( region ) {
        queue.publish( 'pocket.regionexit', { card: card.getId(), region: region.getId() } );
      });

      patch.in.forEach(function( region ) {
        queue.publish( 'pocket.regionenter', { card: card.getId(), region: region.getId() } );
      });
    })
    .catch(function( error ) {
      queue.publish( 'card.trackmovement.fail', { message: error.message });
    });
};

MovementTracker.prototype.trackRegionMovement = function( region ) {
  var tracker = this;
  var queue = this._queue;
  var queries = this._queries;

  return queries.getBoard( region.getBoard() )
    .then(function( board ) {
        return queries.getCardLocationsForBoard( board );
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
    })
    .catch(function( error ) {
      queue.publish( 'region.trackmovement.fail', { message: error.message });
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
  var queue = tracker._queue;
  var queries = tracker._queries;

  return queries.getPocket( id )
    .then(function( card ) {
      var numregions = card.getRegions().length;

      card.addRegion( region );

      if ( card.getRegions().length === numregions ) return;

      queue.publish( 'pocket.regionenter', { card: card.getId(), region: region.getId() } );
    });
}

function markPocketAsNotInRegion( tracker, id, region ) {
  var queue = tracker._queue;
  var queries = tracker._queries;

  return queries.getPocket( id )
    .then(function( card ) {
      var numregions = card.getRegions().length;

      card.removeRegion( region );

      if ( card.getRegions().length === numregions ) return;

      queue.publish( 'pocket.regionexit', { card: card.getId(), region: region.getId() } );
    });
}

module.exports = MovementTracker;
