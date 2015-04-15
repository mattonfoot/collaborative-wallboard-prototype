var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall'
  , storedWall;

function features() {
    beforeEach(function(done) {
      var services = this.services;

      services.createWall({ name: storedName })
        .then(function( wall ) {
          storedWall = wall;

          done();
        })
        .catch( done );
    });

    it('Emit a <wall:display> event with a valid wall id to open the wall\n', function(done) {
      var queue = this.queue;

      queue.subscribe( '#.fail', done );

      queue.when([
            'wall:displayed'
          , 'boardselector:displayed'
          , 'wall:firsttime'
          , 'boardcreator:displayed'
        ], function( a, b, c, d ) {
          should.exist( a );
          a.should.be.a.specificWallResource( storedName );

          should.exist( b );
          b.should.be.an.instanceOf( Array );
          b.length.should.equal( 0 );

          should.exist( c );
          c.should.be.a.specificWallResource( storedName );

          done();
        },
        done,
        { once: true });

      queue.publish( 'wall:display', storedWall.getId() );
    });

}

features.title = 'Displaying a wall';

module.exports = features;
