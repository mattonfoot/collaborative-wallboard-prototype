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
 
  .resource('wall', {
    boards: ['board'],
    pockets: ['pocket']
  })
 
  .resource('board', {
    wall: 'wall',
    key: String,
    cards: ['card'],
    regions: ['regions']
  })
 
  .resource('pocket', {
    title: String,
    cardnumber: Number,
    color: String,
    wall: 'wall',
    cards: ['card']
  })

  .resource('card', {
    x: Number,
    y: Number,
    tagged: String,
    board: 'board',
    pocket: 'pocket'
  })
 
  .resource('region', {
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
  var fail = function( err ) {
    socket
      .emit( fail, { 
        msg: 'failed to create a new region', 
        data: data, 
        err: err 
      });
  };

  socket.on( trigger, function( data ) {
    var obj = { value: data.value, x: data.x, y: data.y, width: data.width, height: data.height };
    
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

 
function setupCardCreation( socket, trigger, success, fail ) {
  
  socket
    .on( trigger, function( data ) {
      var obj = {};
      
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
                }, fail);
            
            }, fail);
        
        }, fail);
    
    });
    
};
  

io.sockets
  .on( 'connection', function ( socket ) {
  
    app.adapter.findMany( 'wall', {} )
      .then(function( walls ) {
        socket.emit( 'app:init', walls );
      
        setupGenericBroadcasts( socket, [ 'pocket:update', 'region:moveend', 'region:resizeend', 'card:moveend', 'card:tagged', 'card:untagged' ] );
        
        setupBoardCreation( socket, 'board:create', 'board:created', 'board:createfail' );
        
        setupPocketCreation( socket, 'pocket:create', 'pocket:created', 'pocket:createfail' );
        
        setupCardCreation( socket, 'card:create', 'card:created', 'card:createfail' );
        
        setupRegionCreation( socket, 'region:create', 'region:created', 'region:createfail' );
      }, function() {
        socket.emit( 'app:initfail' );
      });
      
  });

httpServer.listen( port );

