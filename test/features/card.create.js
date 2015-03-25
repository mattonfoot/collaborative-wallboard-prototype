var chai = require('chai')
  , should = chai.should();

var storedName = 'new card'
  , resourceChecked = false
  , queueChecked = false;



function features() {

    beforeEach(function(done) {
            var services = this.services;
            var belt = this.application.belt;
            var scenarios = this.scenarios;
            var queue = this.queue;

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: 'wall for card' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <pocket:create> event passing a data object with a valid wall id and a title attribute to trigger the process of creating a new Card\n',
            function( done ) {
                    var services = this.services;
                    var belt = this.application.belt;
                    var scenarios = this.scenarios;
                    var queue = this.queue;

        queue.trigger( 'pocket:create', { wall: storedWall.getId(), title: storedName } );

        queue.once( 'pocket:created', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificCardResource( storedName, storedWall.getId() );

            resourceChecked = true;
        });

        queue.once( 'pocket:created', function() {
            queue.should.haveLogged([
                    'pocket:create'
                  , 'pocket:created'
                ]);

            queueChecked = true;
        });

        queue.once( 'pocket:created', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Creating a Card on a Board';

module.exports = features;
