var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall');

var storedName = 'new card'
  , storedWall;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'Wall for card' )
      .then(function( storage ) {
        storedWall = storage.wall;
        
        done();
      })
      .catch( done );
  });

  it('Emit a <pocket.create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.created', function( created ) {
      should.exist( created );
      created.should.be.a.specificCardResource( storedName, storedWall.getId() );

      done();
    })
    .catch( done )
    .once();

    queue.publish( 'pocket.create', { wall: storedWall.getId(), title: storedName } );
  });
}

features.title = 'Creating a Card on a Wall';

module.exports = features;
