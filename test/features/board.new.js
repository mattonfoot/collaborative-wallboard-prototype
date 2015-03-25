var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedWall;

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

        services.createWall({ name: 'wall for board' })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:new> event passing a valid wall id to access an input control allowing you to enter details required to create a new Board\n',
            function(done) {
                    var services = this.services;
                    var belt = this.application.belt;
                    var scenarios = this.scenarios;
                    var queue = this.queue;

        queue.trigger( 'board:new', storedWall.getId() );

        queue.once( 'boardcreator:displayed', function( resource ) {
            should.not.exist( resource );

            resourceChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            queue.should.haveLogged([
                    'board:new'
                  , 'boardcreator:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the board creator input control';

module.exports = features;
