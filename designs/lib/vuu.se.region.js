var Region = (function() {

function Region( queue, socket, data ) {
  var region = this;
  
  region.id = data.id;  
  region.links = data.links || {};
  region.x = data.x;
  region.y = data.y;
  region.width = data.width || 50;
  region.height = data.height || 50;
  region.value = data.value;
  
  // private

  function __broadcastEvent( ev ) { 
    queue.trigger( region, 'region:' + ev, { region: region } );
    
    socket.emit( 'region:' + ev, { region: region } );
  };
  
  // triggers

  socket
    .on('region:moveend', function( data ) {
      if ( region.id == data.region.id ) {
        region.moveTo( data.region.x, data.region.y );
      }
    })
    .on('region:resizeend', function( data ) {
      if ( region.id == data.region.id ) {
        region.resizeTo( data.region.width, data.region.height );
      }
    });
  
  // public functions

  region.getId = function() {
    return region.id;
  };

  region.getBoardId = function() {
    return region.links.board;
  };
  
  region.moveTo = function( x, y ) {
    if ( region.x !== x || region.y !== y) {
      __broadcastEvent( 'movestart' );
      
      region.x = x;
      region.y = y;
      
      __broadcastEvent( 'moveend' );
    }
    
    return region;
  };
  
  region.resizeTo = function( width, height ) {
    if ( region.width !== width || region.height !== height) {
    
    
      __broadcastEvent( 'resizestart' );
      
      region.width = width;
      region.height = height
      
      
      __broadcastEvent( 'resizeend' );
    }
    
    return region;
  };
  
  region.setValue = function( val ) {
    region.value = val;
    
    __broadcastEvent( 'setvalue' );
    
    return region;
  };
  
  return region;
}

return Region;

})();