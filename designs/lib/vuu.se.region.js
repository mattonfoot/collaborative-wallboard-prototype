
  // emits:  region:movestart, region:moveend, region:resizeend, region:resizestart, region:setvalue
  
  // triggers:  region:moveend, region:resizeend, region:setvalue
  
  // on (socket):  region:moveend --> region:moveend, region:resizeend --> region:resizeend
  
  // on (queue):  


var Region = (function() {

function Region( queue, data ) {
  var region = this;
  
  region.id = data.id;  
  region.links = data.links || {};
  region.x = data.x;
  region.y = data.y;
  region.width = data.width || 50;
  region.height = data.height || 50;
  region.value = data.value;
  
  // triggers
  
  queue
    .on( region, 'canvasregion:moved', function( data ) {
      if ( region.id === data.region.id &&
          ( region.x != data.x || region.y != data.y ) ) {
        __moveTo( data.x, data.y );
      
        __broadcastEvent( 'moved' );
      }
    })
    .on( region, 'canvasregion:resized', function( data ) {    
      if ( region.id === data.region.id &&
          ( region.width != data.width || region.height != data.height ) ) {
        __resizeTo( data.width, data.height );
      
        __broadcastEvent( 'resized' );
      }
    })
    .on( region, 'region:updated', function( data ) {    
      if ( region.id === data.id &&
          ( region.width != data.width || region.height != data.height || region.x != data.x || region.y != data.y ) ) {
        __moveTo( data.x, data.y );
        __resizeTo( data.width, data.height );
      }
    });
  
  
  // private

  function __broadcastEvent( ev ) { 
    queue.trigger( region, 'region:' + ev, { region: region } );
  };

  
  function __moveTo( x, y ) {
    region.x = x;
    region.y = y;
  }
  
  function __resizeTo( width, height ) {
    region.width = width;
    region.height = height;
  }
  
  // public functions

  region.getId = function() {
    return region.id;
  };

  region.getBoardId = function() {
    return region.links.board;
  };
  
  region.moveTo = function( x, y ) {
    __moveTo( x, y );
      
    __broadcastEvent( 'moved' );
    
    return region;
  };
  
  region.resizeTo = function( width, height ) {
    __resizeTo( width, height );
      
    __broadcastEvent( 'resized' );
    
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