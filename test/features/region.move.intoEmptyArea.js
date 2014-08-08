var chai = require('chai')
  , should = chai.should();

var storedName = 'new Region'
  , storedWall
  , storedBoard
  , storedRegion
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;



function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.TwoBoardsOneWithRegions()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];
                storedRegion = storage.regions[0];

                update = {
                    id: storedRegion.getId(),
                    x: 600,
                    y: 600
                };

                queue.clearCalls();

                done();
            });
    });

    it('Emit a <region:move> event passing a data object with a valid region id and coordinates to trigger the process of moving a Region around a Board\n',
        function( done ) {

            queue.trigger( 'region:move', update );

            queue.once( 'region:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'region:updated', function() {
                queue.should.haveLogged([
                        'region:move'
                      , 'region:updated'
                    ]);

                queueChecked = true;
            });

            queue.once( 'region:updated', function() {
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed Region into an empty area on the displayed Board';

module.exports = features;
