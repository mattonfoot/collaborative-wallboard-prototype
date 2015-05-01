function FakeUI() {
  this.constructor = FakeUI;

  this.reset();
}

FakeUI.prototype.reset = function() {
  this.called = [];
  this.calledWith = [];
};

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

FakeUI.prototype.displayViewSelector = function( data ) {
  this.called.push( 'displayViewSelector' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayView = function( data ) {
  this.called.push( 'displayView' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.enableControls = function( data ) {
  this.called.push( 'enableControls' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayWallEditor = function( data ) {
  this.called.push( 'displayWallEditor' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayCard = function( data ) {
  this.called.push( 'displayCard' );

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

FakeUI.prototype.displayRegion = function( data ) {
  this.called.push( 'displayRegion' );

  if ( data ) this.calledWith.push( data );

  return true;
};

FakeUI.prototype.displayRegionCreator = function( data ) {
  this.called.push( 'displayRegionCreator' );

  if ( data ) this.calledWith.push( data );

  return true;
};









module.exports = FakeUI;
