var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Pass a valid wall id to enter details required to create a new Card\n', function(done) {
    var queue = this.queue;
    var interface = this.interface;
    var ui = this.ui;

    queue.subscribe( '#.fail', done ).once();

    interface.newCard( wall.getId() )
      .then(function() {
        ui.called.should.deep.equal( [ 'displayCardCreator' ] );
        ui.calledWith.should.deep.equal( [ wall ] );

        done();
      })
      .catch( done );
  });
}

features.title = 'Accessing the card creator input control';

module.exports = features;
