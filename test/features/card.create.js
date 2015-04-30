var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var wall;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        wall = storage.wall;

        done();
      })
      .catch( done );
  });

  it('Create a new Card on a wall by passing a wall id and a title\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'card' );
      created.should.have.property( 'wall', create.wall );
      created.should.have.property( 'title', create.title );

      wall.getCards().should.contain( created.card );

      done();
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId(),
      title: 'new card'
    };

    interface.createCard( create );
  });
}

features.title = 'Creating Cards';

module.exports = features;
