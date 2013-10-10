var Pocket = (function() {

var defaults = { w: 100, h: 65 };
var counter = 0;

function Pocket( queue, socket, config ) {
  var pocket = this;
  pocket.id = config.id || 'pocket_' + (++counter);
  
  var databag = {
    'title': config.title
  };

  // private methods

  function __broadcast( key, value ) {
    var msg = {
      pocketid: pocket.id,
      key: key,
      value: value
    };
    
    queue.trigger( pocket, 'pocket:update', msg );    
    socket.emit( 'pocket:update', msg );
  };
  
  //  triggers 

  queue.on( pocket, 'carddata:update', function( data, card ) {
    if (data.pocketid === pocket.id) {
      databag[ data.key ] = data.value;

      socket.emit( 'pocket:update', data );
    }
  });

  socket.on( 'pocket:update', function( data ) {
    if (data.pocketid === pocket.id) {
      databag[ data.key ] = data.value;

      queue.trigger( pocket, 'pocket:update', data );
    }
  });
  
  // public methods
  
  pocket.set = function( key, value ) {
    databag[ key ] = value;
    
    __broadcast( key, value );
  };

  pocket.get = function( key ) {
    return databag[ key ];
  };
  
  // instance

  return pocket;
}

// export

return Pocket;

})();  
