var Pocket = (function() {

function Pocket( queue, socket, data ) {
  var pocket = this;
  
  pocket.id = data.id;
  pocket.title = data.title;
  pocket.cardnumber = data.cardnumber;
  
  var databag = {};
  
  //  triggers

  socket.on( 'pocket:update', function( data ) {
    if (data.pocket === pocket.id) {
      databag[ data.key ] = data.value;

      queue.trigger( pocket, 'pocket:update', data );
    }
  });
  
  // public functions

  pocket.getId = function() {
    return pocket.id;
  };
  
  pocket.set = function( key, value ) {
    var data = {
      pocket: pocket.id,
      key: key,
      value: value
    };
    
    databag[ data.key ] = data.value;

    queue.trigger( pocket, 'pocket:update', data );
    
    socket.emit( 'pocket:update', data );
    
    return this;
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
