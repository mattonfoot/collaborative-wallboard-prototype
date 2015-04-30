var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards');

var wall, boards;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        wall = storage.wall;
        boards = storage.boards;

        done();
      })
      .catch( done );
  });

  it('Emit a <card.create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    var cardid, boardids = [];

    var subscription = queue.subscribe( 'card.added', function( created ) {
      should.exist( created );

      created.should.have.property( 'card' );
      if ( !cardid ) cardid = created.card;
      created.card.should.equal( cardid );

      created.should.have.property( 'board' );
      boardids.should.not.contain( created.board );
      boardids.push( created.board );

      if ( boardids.length === boards.length ) {
        subscription.unsubscribe();

        done();
      }
    })
    .catch( done )
    .distinct();

    var create = {
      wall: wall.getId(),
      title: 'new card on multiple boards'
    };

    services.createCard( create );
  });
}

features.title = 'Creating a Card on a wall with multiple Boards';

module.exports = features;
