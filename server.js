var fortune = require('fortune')
    connect = require('connect'),
    socketio = require('socket.io'),
    http = require('http');
     
     
var port = process.env.PORT || 5000, 
    config = { db: 'vuu.se' },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

 
app
  .use( connect.static( __dirname + '/designs' ) )
 
  .resource('pocket', {
    pocketid: String,
    title: String,
    cards: ['card']
  })

  .resource('card', {
    cardid: String,
    color: String,
    x: Number,
    y: Number,
    pocket: 'pocket'
  });


function setupGenericBroadcasts( socket, triggers ) {
    
  triggers
    .forEach(function( ev ) {

      socket.on( ev, function ( data ) {
        socket.broadcast.emit( ev, data );
      });
    
    });
      
};


function setupPocketCreation( socket, trigger, success, fail ) {

  socket.on( trigger, function( data ) {
  
    var pocket = app.adapter.create( 'pocket', data )
      .then(function( pocket ) {
        io.sockets.emit( success, pocket );        
      }, function() {
        socket.emit( fail, { error: 'failed to create a new pocket', data: data } );
      });
    
  });
    
};

 
function setupCardCreation( socket, trigger, success, fail ) {
  
  socket.on( trigger, function( data ) {
  
    app.adapter.find( 'pocket', { pocketid: data.pocketid })
      .then(function( pocket ) {        
        data.links = { pocket: pocket.id };
    
        var card = app.adapter.create( 'card', data );
        
        io.sockets.emit( success, card );
      }, function() {
        socket.emit( fail, { error: 'failed to create a new card', data: data } );
      });
  
  });
    
};
  

io.sockets
  .on( 'connection', function ( socket ) {
  
    app.adapter.findMany( 'pocket', {} )
      .then(function( pockets) {
        socket.emit( 'app:init', pockets );
      
        setupGenericBroadcasts( socket, [ 'pocket:update', 'card:update', 'card:tagged', 'card:untagged' ] );
        
        setupPocketCreation( socket, 'pocket:create', 'pocket:created', 'pocket:createfail' );
        
        setupCardCreation( socket, 'card:create', 'card:created', 'card:createfail' );
      }, function() {
        socket.emit( 'app:initfail' );
      });
      
  });

httpServer.listen( port );

