var chai = require('chai')
  , should = chai.should();

var storedWall;

function features() {

    beforeEach(function(done) {
      var services = this.services;

      services.createWall({ name: 'wall for board' })
        .then(function( wall ) {
            storedWall = wall;

            done();
        })
        .catch( done );
    });

    it('Emit a <wall:new> event passing a valid wall id to access an input control allowing you to enter details required to create a new Board\n', function(done) {
      var queue = this.queue;

      queue.subscribe( '#.fail', done );

      queue.when([
        'board:new',
        'boardcreator:displayed'
      ],
      function( a, b ) {
        should.exist( a  );
        a.should.equal( storedWall.getId() );

        b.should.be.instanceOf( queue.nodata );

        done();
      },
      done,
      { once: true });

      queue.trigger( 'board:new', storedWall.getId() );
    });

}

features.title = 'Accessing the board creator input control';

module.exports = features;
