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

  it('Create a new Card on a wall by passing a wall id\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'card.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'card' );
      created.should.have.property( 'wall', create.wall );

      wall.getCards().should.contain( created.card );

      done();
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId()
    };

    interface.createCard( create );
  });

  it('Create a new Card on a wall by passing a wall id and a title\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    var wasCreated = false;
    queue.subscribe( 'card.created', function( created ) {
      should.exist( created );

      created.should.have.property( 'card' );
      created.should.have.property( 'wall', create.wall );

      wall.getCards().should.contain( created.card );

      wasCreated = true;
    })
    .catch( done )
    .once();

    queue.subscribe( 'card.updated', function( updated ) {
      should.exist( updated );

      wasCreated.should.be.true;

      updated.should.have.property( 'card' );
      updated.should.have.property( 'title', create.title );

      wall.getCards().should.contain( updated.card );

      done();
    })
    .catch( done )
    .once();

    var create = {
      wall: wall.getId(),
      title: 'card with title'
    };

    interface.createCard( create );
  });
}

features.title = 'Creating Cards';

module.exports = features;
