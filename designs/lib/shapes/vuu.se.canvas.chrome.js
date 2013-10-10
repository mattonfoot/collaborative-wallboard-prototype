var ChromeCanvas = (function() {

function Chrome( stage ) {
  var layer = new Kinetic.Layer();

  layer.add(
    new Kinetic.Rect({
      name: 'cardMenuChrome',
      id: 'cardMenuChrome',
      x: 1,
      y: 500,
      width: 798,
      height: 99,
      stroke: 'black',
      strokeWidth: 1
    })
  );

  layer.add(
    new Kinetic.Rect({
      name: 'boardMenuChrome',
      id: 'boardMenuChrome',
      x: 1,
      y: 1,
      width: 798,
      height: 50,
      stroke: 'black',
      strokeWidth: 1
    })
  );
  
  stage.add( layer );

  return this;
};

return Chrome;

})();