var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var wallid, card;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'board for card editing' )
      .then(function( storage ) {
        card = storage.card;

        done();
      })
      .catch( done );
  });

  it('Emit a <card.update> event passing an updated data object with a valid card id to trigger the process of updating the stored data for an existing Card\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'title' );

      updated.id.should.equal( card.getId() );
      updated.title.should.equal( update.title );

      card.getTitle().should.equal( update.title );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: card.getId(),
      title: 'edited card'
    };

    services.updatePocket( update );
  });

}

features.title = 'Updating a Card';

module.exports = features;
