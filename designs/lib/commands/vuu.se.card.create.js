
  // emits:  card:create
  
  // triggers:  card:cloned, card:createend, card:moveend
  
  // on (socket):  card:created --> card:createend + card:moveend
  
  // on (queue):  pocket:createend --> card:add + card:add, pocket:cloned --> card:clone + card:clone, card:add --> card:createbegin, card:createbegin --> card:create, card:clone --> card:cloned + card:moveend






  // triggers

queue.on( app.wall, 'card:create', createCard );

queue.on( app.wall, 'card:clone', cloneCard );
  
  
  
  
  
  
  // handlers

function createCard( data ) {
  __buildCard( 'card:created', data );
}
  
function cloneCard( data ) {
  __buildCard( 'card:cloned', data );
}



// helpers


function __buildCard( ev, data ) {
  var boardid = (data.board ? data.board.id : data.links.board );

  var board = app.wall.getBoardById( boardid );

  var card = new Card( queue, data );

  if ( board.addCard( card ) ) {
    queue.trigger( card, ev, { card: card } );
    
    queue.trigger( card, 'card:moved', { card: card });
  }
}
