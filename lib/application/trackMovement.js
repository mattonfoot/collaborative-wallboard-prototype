var cardHeight = 65;
var cardWidth = 100;

const cardIsInRegion = (card, region) => {
  var pos = card.getPosition( region.getView() );

  var cardX = (pos.x + (cardWidth / 2)),
      cardY = (pos.y + (cardHeight / 2));

/*
  // this appears to not be working??
  var centre = card.getCentre( region.getId() );

  console.log( cardX, cardY, centre );
*/
  var inLeft = cardX > region.x,
      inRight = cardX < (region.x + region.width),
      inTop = cardY > region.y,
      inBase = cardY < (region.y + region.height);

  return ( inLeft && inRight && inTop && inBase );
};

function MovementTracker( queue, repository ) {
  var movementTracker = this;
  this.queue = queue;
  this.repository = repository;

  queue.subscribe( 'card.moved', function( data ) {
    movementTracker.trackCardMovement( data );
  });

  queue.subscribe( 'region.moved', function( data ) {
    movementTracker.trackRegionMovement( data );
  });

  queue.subscribe( 'region.resized', function( data ) {
    movementTracker.trackRegionMovement( data );
  });
}

MovementTracker.prototype.trackCardMovement = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var patch = { in: [], out: [] };
  var card;

  // get the card for the location
  return repository.getCard( data.card )
    .then(function( resource ) {
      card = resource;

      return repository.getWall( card.getWall() );
    })
    .then(function( wall ) {
      var regionids = wall.getRegions( data.view );

      return repository.getRegions( regionids );
    })
    .then(function( regions ) {
      var update = [];

      regions.forEach(function( region ) {
        var regionid = region.getId()
          , isInRegion = cardIsInRegion( card, region )
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

      if ( !patch.in.length && !patch.out.length ) {
        return card;
      }

      card.regions = update;

      patch.out.forEach(function( region ) {
        queue.publish( 'card.regionexited', { card: card.getId(), region: region.getId() } );
      });

      patch.in.forEach(function( region ) {
        queue.publish( 'card.regionentered', { card: card.getId(), region: region.getId() } );
      });
    })
    .catch(function( error ) {
      queue.publish( 'card.trackmovement.fail', error );
    });
};

MovementTracker.prototype.trackRegionMovement = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getView( region.getView() );
    })
    .then(function( view ) {
      return repository.getWall( view.getWall() );
    })
    .then(function( wall ) {
      return repository.getCards( wall.getCards() );
    })
    .then(function( cards ) {
      cards.forEach(function( card ) {
        if ( ~region.getCards().indexOf( card.getId() ) && !cardIsInRegion( card, region ) ) {
          queue.publish( 'card.regionexited', { card: card.getId(), region: region.getId() } );
        }
      });

      cards.forEach(function( card ) {
        if ( !~region.getCards().indexOf( card.getId() ) && cardIsInRegion( card, region ) ) {
          queue.publish( 'card.regionentered', { card: card.getId(), region: region.getId() } );
        }
      });
    })
    .catch(function( error ) {
      queue.publish( 'region.trackmovement.fail', error );
    });
};

module.exports = MovementTracker;
