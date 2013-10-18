




  // triggers

queue.on( app.wall, 'pocket:createend', triggerAddCard );

queue.on( app.wall, 'pocket:cloned', triggerCloneCard );

queue.on( app.wall, 'card:add', addCard );

queue.on( app.wall, 'card:createbegin', createCard );

queue.on( app.wall, 'card:clone', cloneCard );

socket.on( 'card:created', completeCard );
  
  
  
  
  
  
  // handlers
  
function triggerAddCard( data ) {
  __createCard( 'card:add', data );
}
  
function triggerCloneCard( data ) {
  __createCard( 'card:clone', data );
}

function addCard( data ) {
  queue.trigger( this, 'card:createbegin', data );
}

function cloneCard( data ) {
  $.get('/pockets/' + data.pocket.id + '/cards/', function( resources ) {
    resources.cards.forEach(function( card ) {    
      if ( card.links.board == data.board.id ) {
        __buildCard( 'card:cloned', card );
      }
    });
  });
}

function createCard( data ) {
  socket.emit( 'card:create', data );
}

function completeCard( data ) {
  __buildCard( 'card:createend', data );
}



// helpers

function __createCard( ev, data ) {
  var pocket = data.pocket;
  
  if ( data.board ) {
    queue.trigger( this, ev, { board: data.board, pocket: pocket } );
    
    return;
  }
  
  app.wall.links.boards.forEach(function( board ) {  
    queue.trigger( this, ev, { board: board, pocket: pocket } );
  });
}


function __buildCard( ev, data ) {
  var board = app.wall.getBoardById( data.links.board );

  var card = new Card( queue, socket, data );

  if ( board.addCard( card ) ) {
    queue.trigger( card, ev, { card: card } );
  }
}
