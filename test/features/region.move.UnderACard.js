var chai = require('chai')
  , should = chai.should();

var storedName = 'new region'
  , storedWall
  , storedBoard
  , storedPocket
  , storedRegion
  , storedLocation
  , resourceChecked = false
  , locationChecked = false
  , queueChecked = false
  , update;

function features() {

    beforeEach(function(done) {
            var services = this.services;
            var belt = this.application.belt;
            var scenarios = this.scenarios;
            var queue = this.queue;

        scenarios.TwoBoardsOneWithRegions.call( this )
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[1];
                storedPocket = storage.pockets[0];
                storedRegion = storage.regions[0];
                storedLocation = storage.locations[2];

                update = {
                    id: storedRegion.getId(),
                    x: 400,
                    y: 0
                };

                queue.clearCalls();

                done();
            })
            .catch( done );
    });

    it('Emit a <region:move> event passing a data object with a valid region id and coordinates which enclose a Card on the same Board to trigger the process of moving a Region under a Card on a Board\n',
        function( done ) {
                var services = this.services;
                var belt = this.application.belt;
                var scenarios = this.scenarios;
                var queue = this.queue;

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

            queue.once( 'region:updated', function( resource ) {
                resource.getId().should.equal( storedRegion.getId() );

                resourceChecked = true;
            });

            queue.once( 'pocket:regionenter', function( info ) {
                info.pocket.getId().should.equal( storedPocket.getId() );
                info.region.getId().should.equal( storedRegion.getId() );
                // info.region.getPockets().should.contain( storedPocket.getId() );

                queue.should.haveLogged([
                        'region:move'
                      , 'region:updated'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                      , 'pocket:updated'
                      , 'pocket:transformed'
                      , 'pocket:updated'
                      , 'pocket:transformed'
                    ]);

                queueChecked = true;
            });

            queue.once( 'pocket:regionenter', function() {
                resourceChecked.should.equal( true );
                locationChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Moving a displayed Region under a Card on the displayed Board';

module.exports = features;
