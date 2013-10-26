
  // emits:  
  
  // triggers:  card:regionenter, card:regionexit
  
  // on (socket):  
  
  // on (queue):  card:moveend --> (card:regionenter || card:regionexit), region:moveend, card:regionenter --> [pocket:update], card:regionexit --> [pocket:update]


    // setup the card region collision watcher
    
    var regionalcards = {};

    function cardIsInRegion( card, region ) {
      var inLeft = card.x > region.x,
          inRight = (card.x + 100) < (region.x + region.width);
          inTop = card.y > region.y;
          inBase = (card.y + 65) < (region.y + region.height);

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
    
    function trackCardMovement( data ) {      
      var card = data.card;
      var board = app.wall.getBoardById( card.getBoardId() );
      var regions = board.regions;
      
      regions.forEach(function( region ) {
        var hasBeenRemoved = markCardAsNotInRegion( card.id, region.id ),
            hasBeenAdded = false,
            ev;
      
        if ( cardIsInRegion( card, region ) ) {
          hasBeenAdded = markCardAsInRegion( card.id, region.id );
        }
        
        if ( hasBeenRemoved && !hasBeenAdded ) {
          ev = 'card:regionexit'
        }
        
        if ( !hasBeenRemoved && hasBeenAdded ) {
          ev = 'card:regionenter'
        }
        
        if ( ev ) {
          queue.trigger( board, ev, { board: board, card: card, region: region } );
        }
      });
    }
    
    queue
      .on( app, 'card:moved', trackCardMovement)
      
      .on( app, 'region:moved', function( data ) { /* console.log( 'region:moved', data ); */ }) // check to see if any new cards have entered ??
      
      .on( app, 'card:regionenter', function( data ) {
        var pocket = app.wall.getPocketById( data.card.getPocketId() );
        
        pocket.set( data.board.key, data.region.value );
      })
      
      .on( app, 'card:regionexit', function( data ) {
        var pocket = app.wall.getPocketById( data.card.getPocketId() );
        
        pocket.set( data.board.key );
      });
  
  