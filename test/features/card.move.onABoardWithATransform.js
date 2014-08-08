var chai = require('chai')
  , should = chai.should();

var storedName
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
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.colorChangingBoard()
            .then(function( storage ) {
                storedWall = storage.wall;
                storedBoard = storage.boards[0];
                storedPocket = storage.pockets[0];
                storedRegion = storage.regions[0];
                storedLocation = storage.locations[0];

                update = {
                    id: storedLocation.getId(),
                    x: 350,
                    y: 100
                };

                queue.clearCalls();

                done();
            });
    });

    it('Transforms setup on a Board will be activated when their criteria are met\n',
        function( done ) {

            queue.trigger( 'cardlocation:move', update );

            queue.once( 'pocket:transformed', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificCardResource( storedPocket.getTitle(), storedWall.getId() );
                resource.getColor().should.contain( storedRegion.getColor() );

                resourceChecked = true;
            });

            queue.once( 'pocket:transformed', function( resource ) {
                queue.should.haveLogged([
                        'cardlocation:move'
                      , 'cardlocation:updated'
                      , 'pocket:updated'
                      , 'pocket:regionenter'
                      , 'pocket:updated'
                      , 'pocket:transformed'
                    ]);

                queueChecked = true;
            });

            queue.once( 'pocket:transformed', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Activating a Transform defined for a board';

module.exports = features;
