var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
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
                    id: storedLocation.getId(),
                    x: 350,
                    y: 100
                };

                queue.clearCalls();

                done();
            })
            .catch( done );
    });

    it('Emit a <cardlocation:move> event passing a data object with a valid location id and coordinates within a Region on the same Board to trigger the process of moving a Card over a Region on a Board\n',
        function( done ) {
                var services = this.services;
                var belt = this.application.belt;
                var scenarios = this.scenarios;
                var queue = this.queue;

            queue.trigger( 'cardlocation:move', update );

            queue.once( 'cardlocation:updated', function( resource ) {
                should.exist( resource );

                resource.should.respondTo( 'getId' );
                resource.should.respondTo( 'getPocket' );
                resource.getPocket().should.equal( storedPocket.getId() );
                resource.should.respondTo( 'getBoard' );
                resource.getBoard().should.equal( storedBoard.getId() );
                resource.should.respondTo( 'getX' );
                resource.getX().should.equal( update.x );
                resource.should.respondTo( 'getY' );
                resource.getY().should.equal( update.y );

                locationChecked = true;
            });

            queue.once( 'pocket:updated', function( resource ) {
                resource.getId().should.equal( storedPocket.getId() );
                resource.getRegions().should.contain( storedRegion.getId() );

                resourceChecked = true;
            });

            queue.once( 'pocket:regionenter', function( info ) {
                info.pocket.getId().should.equal( storedPocket.getId() );
                info.region.getId().should.equal( storedRegion.getId() );

                queue.should.haveLogged([
                        'cardlocation:move'
                      , 'cardlocation:updated'
                      , 'pocket:updated'
                      , 'cardlocation:updated'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                      , 'pocket:updated'
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

features.title = 'Moving a displayed card over a region on the displayed board';

module.exports = features;
