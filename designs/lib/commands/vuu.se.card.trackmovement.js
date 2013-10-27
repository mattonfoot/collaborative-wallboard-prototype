
  // emits:  
  
  // triggers:  card:regionenter, card:regionexit
  
  // on (socket):  
  
  // on (queue):  card:moveend --> (card:regionenter || card:regionexit), region:moveend, card:regionenter --> [pocket:update], card:regionexit --> [pocket:update]


    // setup the card region collision watcher
    
    var regionalcards = {};

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
    
    function trackCardMovement( data ) {      
      var card = data.card;
      var board = app.wall.getBoardById( card.getBoardId() );
      var regions = board.regions;
      
      // has the card left the regions it was in
      
      regions.forEach(function( region ) {
        if ( !cardIsInRegion( card, region ) ) {
          if ( markCardAsNotInRegion( card.id, region.id ) ) {
            queue.trigger( board, 'card:regionexit', { board: board, card: card, region: region } );
          }
        }
      });
      
      // has the card entered any new regions
      
      regions.forEach(function( region ) {      
        if ( cardIsInRegion( card, region ) ) {
          if ( markCardAsInRegion( card.id, region.id ) ) {
            queue.trigger( board, 'card:regionenter', { board: board, card: card, region: region } );
          }
        }
      });
    }
    
    queue
      .on( app, 'card:moved', trackCardMovement)
      .on( app, 'card:updated', function( data ) {
        var board = app.wall.getBoardById( data.links.board );
        
        var card = board.getCardById( data.id );
      
        trackCardMovement( { card: card } );
      })
      
      .on( app, 'region:moved', function( data ) { /* console.log( 'region:moved', data ); */ }) // check to see if any new cards have entered ??
      
      .on( app, 'card:regionenter', function( data ) {
        var pocket = app.wall.getPocketById( data.card.getPocketId() );
        
        pocket.set( data.board.key, data.region.value );
      })
      
      .on( app, 'card:regionexit', function( data ) {
        var pocket = app.wall.getPocketById( data.card.getPocketId() );
        
        pocket.set( data.board.key );
      });
  
  