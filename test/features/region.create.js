var chai = require('chai')
  , should = chai.should()
  , RSVP = require('rsvp')
  , Promise = RSVP.Promise;

var storedName = 'Created Region'
  , storedWall
  , storedBoard
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        services.createWall({ name: 'Regions  wall' })
            .then(function( wall ) {
                storedWall = wall;

                return services.createBoard({ wall: wall.getId(), name: 'Board for Region Create' });
            })
            .then(function( board ) {
                storedBoard = board;

                queue.once( 'controls:enabled', function() {
                    queue.clearCalls();

                    done();
                });
            })
            .catch( done );
    });

    it('Emit a <region:create> event passing a data object with a valid Board id and a label attribute to trigger the process of creating a new Region\n',
            function( done ) {

        queue.trigger( 'region:create', { board: storedBoard.getId(), label: storedName } );

        queue.once( 'region:created', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificRegionResource( storedName, storedBoard.getId() );

            resourceChecked = true;
        });

        queue.once( 'region:created', function() {
            queue.should.haveLogged([
                    'region:create'
                  , 'region:created'
                ]);

            queueChecked = true;
        });

        queue.once( 'region:created', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });
}

features.title = 'Creating a Region on a Board';

module.exports = features;
