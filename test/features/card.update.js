var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var card;

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

  it('Update a card by providing an existing card id and a new title\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'card', update.card );
      updated.should.have.property( 'title', update.title );

      card.getTitle().should.equal( update.title );

      done();
    })
    .catch( done )
    .once();

    var update = {
      card: card.getId(),
      title: 'edited card'
    };

    services.updateCard( update );
  });

}

features.title = 'Updating Cards';

module.exports = features;
