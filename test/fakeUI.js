function FakeUI() {
  this.constructor = FakeUI;

  this.called = [];
  this.calledWith = [];
}

FakeUI.prototype.displayWallCreator = function( data ) {
  this.called.push( 'displayWallCreator' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayWallSelector = function( data ) {
  this.called.push( 'displayWallSelector' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayWall = function( data ) {
  this.called.push( 'displayWall' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayViewCreator = function( data ) {
  this.called.push( 'displayViewCreator' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayView = function( data ) {
  this.called.push( 'displayView' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayWallEditor = function( data ) {
  this.called.push( 'displayWallEditor' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayCardCreator = function( data ) {
  this.called.push( 'displayCardCreator' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayViewEditor = function( data ) {
  this.called.push( 'displayViewEditor' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayRegionCreator = function( data ) {
  this.called.push( 'displayRegionCreator' );

  if ( data ) this.calledWith.push( data );

  return true;
};









module.exports = FakeUI;
