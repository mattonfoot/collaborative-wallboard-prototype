var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for board' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Emit a <wall.new> event passing a valid wall id to access an input control allowing you to enter details required to create a new Board\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.newView( wall.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayViewCreator' ] );
        ui.calledWith.should.deep.equal( [ wall ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Accessing the board creator input control';

module.exports = features;
