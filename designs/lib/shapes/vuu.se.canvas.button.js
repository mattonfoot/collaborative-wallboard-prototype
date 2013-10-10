var ButtonCanvas = (function() {

function Button( stage, text, event, config ) {
  var layer = new Kinetic.Layer({
    x: config.x,
    y: config.y,
  });

  var button = new Kinetic.Text({
    x: 0,
    y: 0,
    text: text,
    fontSize: config.fontSize,
    fontFamily: 'Calibri',
    fill: 'grey',
    width: config.width,
    padding: 10,
    align: 'center'
  });
  
  layer.add( button );  

  button.on('click touch', function() {
    queue.trigger( this, event, {} );
  }); 
  
  stage.add( layer );

  return this;
};

return Button;

})();