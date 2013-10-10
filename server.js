var fortune = require('fortune')
    connect = require('connect'),
    socketio = require('socket.io'),
    http = require('http');
     
     
var port = process.env.PORT || 5000;
 
var config = {
  db: 'vuu.se',
  namespace: 'api/head',
  cors: true,
  production: false
};
 
var app = fortune( config );

var httpServer = require('http').createServer( app.router );

var io = socketio.listen( httpServer );
 
app.use( connect.static(__dirname + '/designs') );
 
app.resource('pocket', {
  name: String,
  guid: String,
  data: ['pocketData']
});
 
app.resource('pocketData', {
  name: String,
  value: String,
  pocket: ['pocket']
});

io.sockets
  .on('connection', function (socket) {
  
    [ 'pocket:create', 'pocket:update', 'card:create', 'card:update', 'card:tagged', 'card:untagged' ]
      .forEach(function( ev ) {

        socket.on( ev, function ( data ) { socket.broadcast.emit( ev, data ); });
      
      });

  });

httpServer.listen( port );

