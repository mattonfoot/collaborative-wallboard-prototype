var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithMultipleBoards.FirstWithTwoRegions');

var wallid, card;

function features() {
  beforeEach(function( done ) {
    var services = this.services;

    fixture( this, 'board for region editing' )
      .then(function( storage ) {
        region = storage.region;

        done();
      })
      .catch( done );
  });

  it('Updating the label property of an existing Region\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'region.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'label' );

      updated.id.should.equal( region.getId() );
      updated.label.should.equal( update.label );

      region.getLabel().should.equal( update.label );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: region.getId(),
      label: 'edited region label'
    };

    services.updateRegion( update );
  });

  it('Updating the value property of an existing Region\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'region.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'value' );

      updated.id.should.equal( region.getId() );
      updated.value.should.equal( update.value );

      region.getValue().should.equal( update.value );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: region.getId(),
      value: 'edited region value'
    };

    services.updateRegion( update );
  });

  it('Updating the color property of an existing Region\n', function(done) {
    var queue = this.queue;
    var services = this.services;

    queue.subscribe( '#.fail', done ).once();

    var subscription = queue.subscribe( 'region.updated', function( updated ) {
      should.exist( updated );
      updated.should.have.property( 'id' );
      updated.should.have.property( 'color' );

      updated.id.should.equal( region.getId() );
      updated.color.should.equal( update.color );

      region.getColor().should.equal( update.color );

      done();
    })
    .catch( done )
    .once();

    var update = {
      id: region.getId(),
      color: 'magenta'
    };

    services.updateRegion( update );
  });

}

features.title = 'Updating a Region';

module.exports = features;