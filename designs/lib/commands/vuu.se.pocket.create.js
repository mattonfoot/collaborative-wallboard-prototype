var PocketFactory = (function() {

// constructor

function PocketFactory( queue, socket, wall ) {
  var factory = this;

  // private methods

  function __buildPocket( type, data ) {
    var config = {
      title: data.title || prompt('Please enter a title', 'Sample card')
    };
    
    if ( data.pocketid ) {
      config.pocketid = data.pocketid;
    }
    
    var pocket = new Pocket( queue, socket, config );
    
    config.pocketid = pocket.id;
    
    queue.trigger( pocket, 'pocket'+ type +':start', config );
    
    wall.addPocket( pocket );
    
    if ( type === 'create' ) {
      socket.emit( 'pocket:create', config );
    }
      
    queue.trigger( pocket, 'pocket'+ type +':end', config );
  };
  
  // triggers
  
  queue.on( factory, 'pocket:add', function( data ) {
    __buildPocket( 'create', data );
  });
  
  socket.on( 'pocket:create', function( data ) {
    __buildPocket( 'clone', data );
  });
  
  // public methods
  
  // instance
  
  return factory;
}

// export

return PocketFactory;

})();