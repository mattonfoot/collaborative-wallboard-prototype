
  // emits:  region:create
  
  // triggers:  region:createbegin, region:createend, region:cloned
  
  // on (socket):  region:created --> region:createend
  
  // on (queue):  region:add --> region:createbegin, region:createbegin --> region:create, region:clone --> region:cloned






  // triggers

queue.on( app.wall, 'region:clone', cloneRegions );

queue.on( app.wall, 'region:create', createRegion );






  // handlers

function cloneRegions( data ) {
  $.get('/regions/' + data.region.id, function( resources ) {
    resources.regions.forEach(function( region ) {    
      if ( region.links.board == data.board.id ) {
        __buildRegion( 'region:cloned', region );
      }
    });
  });
}

function createRegion( data ) {
  __buildRegion( 'region:created', data );
}




  // helpers

function __buildRegion( ev, data ) {
  var board = app.wall.getBoardById( data.links.board );

  var region = new Region( queue, data );

  if ( board.addRegion( region ) ) {
    queue.trigger( region, ev, { region: region } );
  }
}