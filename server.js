var fortune = require('fortune')
    connect = require('connect'),
    socketio = require('socket.io'),
    http = require('http');
     
     
var port = process.env.PORT || 5000, 
    config = { db: 'vuu.se' },
    app = fortune( config ),
    httpServer = http.createServer( app.router ),
    io = socketio.listen( httpServer );

 
app.use( connect.static( __dirname + '/designs' ) );

require('./lib/vuu.se.hypermedia.wall.js').init( app, io );
 
app.resource('board', {
    wall: 'wall',
    key: String,
    cards: ['card'],
    regions: ['region']
  });
 
app.resource('pocket', {
    title: String,
    cardnumber: Number,
    color: String,
    wall: 'wall',
    cards: ['card']
  });

app.resource('card', {
    x: Number,
    y: Number,
    tagged: String,
    board: 'board',
    pocket: 'pocket'
  });
 
app.resource('region', {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    value: String,
    board: 'board'
  });


function setupGenericBroadcasts( socket, triggers ) {
    
  triggers
    .forEach(function( ev ) {

      socket
        .on( ev, function ( data ) {
          socket.broadcast.emit( ev, data );
        });
    
    });
      
};


function setupBoardCreation( socket, trigger, success, fail ) {
  var fail = function( err ) {
    socket
      .emit( fail, { 
        msg: 'failed to create a new board', 
        data: data, 
        err: err 
      });
  };

  socket
    .on( trigger, function( data ) {
      var obj = { key: data.key };
    
      app.adapter
        .find( 'wall', data.wall.id )
        .then(function( wall ) {
          obj.links = { wall: wall.id };
    
          app.adapter
            .create( 'board', obj )
            .then(function( board ) {          
              io.sockets.emit( success, board );
            }, fail);
        
        }, fail);
      
    });
    
};


function setupPocketCreation( socket, trigger, success, fail ) {
  var fail = function( err ) {
    socket
      .emit( fail, { 
        msg: 'failed to create a new pocket', 
        data: data, 
        err: err 
      });
  };

  socket.on( trigger, function( data ) {
    var obj = { title: data.title };
    
    app.adapter
      .find( 'wall', data.wall.id )
      .then(function( wall ) {
        obj.links = { wall: wall.id };
            
        app.adapter
          .findMany( 'pocket', { links: { wall: data.wall.id } } )
          .then(function( pockets ) {
            obj.cardnumber = pockets.length + 1;
      
            app.adapter
              .create( 'pocket', obj )
              .then(function( pocket ) {
                io.sockets.emit( success, pocket ); 
              }, fail);
          
          }, fail);
      
      }, fail);
    
  });
    
};


function setupRegionCreation( socket, trigger, success, fail ) {
  socket.on( trigger, function( data ) {
    var obj = { value: data.value, x: data.x, y: data.y, width: data.width, height: data.height };
    
    var fail = function( err ) {
      socket
        .emit( fail, { 
          msg: 'failed to create a new region', 
          data: data, 
          err: err 
        });
    };
    
    app.adapter
      .find( 'board', data.board.id )
      .then(function( board ) {
        obj.links = { board: board.id };
      
        app.adapter
          .create( 'region', obj )
          .then(function( resource ) {
            io.sockets.emit( success, resource ); 
          }, fail);
      
      }, fail);
    
  });
    
};

function setupRegionUpdates( socket, triggers ) {
  triggers
    .forEach(function( ev ) {

      socket
        .on( ev, function ( data ) {
        
          var fail = function( err ) {
            socket
              .emit( fail, { 
                msg: 'failed to update region', 
                data: data, 
                err: err 
              });
          };
              
          app.adapter
            .update( 'region', data.region.id, data.region )
            .then(function( resource ) {            
              socket.broadcast.emit( ev, resource );
              
            }, fail );
        
        });
    
    });
}

 
function setupCardCreation( socket, trigger, success, fail ) {
  
  socket
    .on( trigger, function( data ) {
      var obj = { x: data.x, y: data.y, tagged: data.tagged };
      
      var fail = function( err ) {
        socket
          .emit( fail, { 
            msg: 'failed to create a new card', 
            data: data, 
            err: err 
          });
      };
      
      app.adapter
        .find( 'card', { links: { board: data.board.id, pocket: data.pocket.id } } )
        .then(function( card ) {        
          io.sockets.emit( success, card );
        
        }, function() {      
          app.adapter
            .find( 'board', data.board.id )
            .then(function( board ) {
              obj.links = { board: board.id };
            
              app.adapter
                .find( 'pocket', data.pocket.id )
                .then(function( pocket ) {
                  obj.links.pocket = pocket.id;
            
                  app.adapter
                    .create( 'card', obj )
                    .then(function( card ) {
                      io.sockets.emit( success, card );
                    }, fail );
                
                }, fail );
            
            }, fail );
            
        });
    
    });
    
};

function setupCardUpdates( socket, triggers ) {    
  triggers
    .forEach(function( ev ) {

      socket
        .on( ev, function ( data ) {
        
          var fail = function( err ) {
            socket
              .emit( fail, { 
                msg: 'failed to update card', 
                data: data, 
                err: err 
              });
          };
              
          app.adapter
            .update( 'card', data.card.id, data.card )
            .then(function( resource ) {            
              socket.broadcast.emit( ev, resource );
              
            }, fail );
        
        });
    
    });
}
  

io.sockets
  .on( 'connection', function ( socket ) {
      
    setupGenericBroadcasts( socket, [ 'pocket:update' ] );
    
    setupBoardCreation( socket, 'board:create', 'board:created', 'board:createfail' );
    
    setupPocketCreation( socket, 'pocket:create', 'pocket:created', 'pocket:createfail' );
    
    setupCardCreation( socket, 'card:create', 'card:created', 'card:createfail' );
    setupCardUpdates( socket, [ 'card:moveend', 'card:tagged', 'card:untagged' ] );
    
    setupRegionCreation( socket, 'region:create', 'region:created', 'region:createfail' );
    setupRegionUpdates( socket, [ 'region:moveend', 'region:resizeend' ] );
      
  });

httpServer.listen( port );

