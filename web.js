var fortune = require('fortune')
    connect = require('connect');

var config = {
  db: 'vuu.se',
  namespace: 'api/head',
  cors: true,
  production: false
};

var app = fortune( config );

app.use( connect.static(__dirname + '/designs') );

app.resource('wall', {
  name: String,
  guid: String,
  boards: ['board'],
  pockets: ['pocket']
});

app.resource('board', {
  name: String,
  guid: String,
  attributeName: String,
  wall: 'wall'
});

app.resource('pocket', {
  name: String,
  guid: String,
  wall: 'wall',
  data: ['pocketData']
});

app.resource('pocketData', {
  name: String,
  value: String,
  pocket: ['pocket']
});

app.listen( 9999 );