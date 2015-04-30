var chai = require('chai');
var should = chai.should();
var fixture = require('../fixtures/BasicWall.WithOneView');

var wall, view;

function features() {
  beforeEach(function( done ) {
    fixture( this, 'Wall for region' )
      .then(function( storage ) {
        wall = storage.wall;
        view = storage.view;

        done();
      })
      .catch( done );
  });

  it('Create a new Region with just a label\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.created', function( created ) {
      created.should.have.property( 'region' );
      created.should.have.property( 'view', create.view );
      created.should.have.property( 'label', create.label );
      created.should.not.have.property( 'value' );
      created.should.not.have.property( 'color' );

      wall.getRegions( create.view ).should.contain( created.region );

      done();
    })
    .catch( done )
    .once();

    var create = {
      view: view.getId(),
      label: 'new region'
    };

    interface.createRegion( create );
  });

  it('Create a new Region with a label and a value\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.created', function( created ) {
      created.should.have.property( 'region' );
      created.should.have.property( 'view', create.view );
      created.should.have.property( 'label', create.label );
      created.should.have.property( 'value', create.value );
      created.should.not.have.property( 'color' );

      wall.getRegions( create.view ).should.contain( created.region );

      done();
    })
    .catch( done )
    .once();

    var create = {
      view: view.getId(),
      label: 'new region with value',
      value: 1
    };

    interface.createRegion( create );
  });

  it('Create a new Region with a label and a color\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.created', function( created ) {
      created.should.have.property( 'region' );
      created.should.have.property( 'view', create.view );
      created.should.have.property( 'label', create.label );
      created.should.not.have.property( 'value' );
      created.should.have.property( 'color', create.color );

      wall.getRegions( create.view ).should.contain( created.region );

      done();
    })
    .catch( done )
    .once();

    var create = {
      view: view.getId(),
      label: 'new region with color',
      color: 'red'
    };

    interface.createRegion( create );
  });

  it('Create a new Region with a label, a value and a color\n', function( done ) {
    var queue = this.queue;
    var interface = this.interface;

    queue.subscribe( '#.fail', done ).once();

    queue.subscribe( 'region.created', function( created ) {
      created.should.have.property( 'region' );
      created.should.have.property( 'view', create.view );
      created.should.have.property( 'label', create.label );
      created.should.have.property( 'value', create.value );
      created.should.have.property( 'color', create.color );

      wall.getRegions( create.view ).should.contain( created.region );

      done();
    })
    .catch( done )
    .once();

    var create = {
      view: view.getId(),
      label: 'new region with color and value',
      value: 'My value',
      color: 'red'
    };

    interface.createRegion( create );
  });
}

features.title = 'Creating Regions';

module.exports = features;
