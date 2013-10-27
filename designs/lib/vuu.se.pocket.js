  
  // emits:  pocket:update
  
  // triggers:  pocket:update
  
  // on (socket):  pocket:update --> pocket:update
  
  // on (queue):  

var Pocket = (function() {

function Pocket( queue, data ) {
  var pocket = this;
  
  pocket.id = data.id;
  pocket.title = data.title;
  pocket.cardnumber = data.cardnumber;
  
  var databag = {};
  
  // private
  
  function __set( key, value ) {
    var data = {
      pocket: pocket.id,
      key: key,
      value: value
    };
    
    databag[ data.key ] = data.value;

    queue.trigger( pocket, 'pocket:update', data );
    
    return pocket;
  }
  
  // public functions

  pocket.getId = function() {
    return pocket.id;
  };
  
  pocket.set = function( key, value ) {
    return __set( key, value );
  };

  pocket.get = function( key ) {
    return databag[ key ];
  };

  pocket.getData = function() {
    var d = {};
    
    for ( var key in databag ) {
      d[ key ] = databag[ key ];
    }
  
    return d;
  };
  
  // instance

  return pocket;
}

// export

return Pocket;

})();  
