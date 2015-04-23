var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var storedWall, storedLocation, storedRegion, storedCard;

function features() {
  beforeEach(function( done ) {
    var services = this.services;
    var queries = this.application.queries;

    fixture( this, 'Wall for moving a card on' )
      .then(function( storage ) {
        storedWall = storage.wall;
        storedRegion = storage.region;
        storedCard = storage.card;

        return queries.getCardLocation( storedCard.getCardLocations()[0] );
      })
      .then(function( location ) {
        storedLocation = location;

        done();
      })
      .catch( done );
  });

  it('Transforms setup on a Board will be activated when their criteria are met\n', function( done ) {
    var queue = this.queue;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'pocket.transformed', function( transform ) {
      should.exist( transform );

      transform.should.have.property( 'op' );
      transform.op.should.equal( 'set' );
      transform.should.have.property( 'card' );
      transform.card.should.equal( storedCard.getId() );
      transform.should.have.property( 'property' );
      transform.property.should.equal( 'color' );
      transform.should.have.property( 'value' );
      transform.value.should.equal( storedRegion.getColor() );

      done();
    })
    .catch( done )
    .once();

    storedRegion.x = 0;
    storedRegion.y = 0;

    queue.publish( 'region.move', storedRegion );

  });
}

features.title = 'Activating a Transform defined for a board by moving a region beneath a card';

module.exports = features;
