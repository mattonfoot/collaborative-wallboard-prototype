
  // emits app:init, app:initfail

function init( app, io ) {

  var db = app.adapter;

  var walldata = {
      name: String,
      boards: ['board'],
      pockets: ['pocket']
    };
    
  function onConnect( app, socket ) {
    
    function onInitFail( err ) { 
      socket.emit( 'app:initfail', err );
      
      // log to the server as well
    }

    function create() {
      db.create( 'wall', {} )
        .then( function( resource ) {
          socket.emit( 'app:init', [ buildWall( resource ) ] );
        }, 
          onInitFail
        );
    }
    
    db.findMany( 'wall', {} )
      .then( function( resources ) {      
        if ( resources.length <= 0 ) {
          return create();        
        }
        
        socket.emit( 'app:init', resources );
      }, onInitFail );  
  }
 
  app.resource('wall', walldata );

  io.sockets.on( 'connection', function( socket ) { onConnect( app, socket ); } );
  
};

module.exports = {
  init: init
}