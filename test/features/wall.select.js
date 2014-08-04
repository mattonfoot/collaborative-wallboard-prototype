var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedName = 'display wall'
  , storedWall;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'wall:firsttime', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:select> event - no data object is needed - to access an input control allowing you to select a Wall for display\n',
            function(done) {

        queue.trigger( 'wall:select' );

        queue.once( 'wallselector:displayed', function() {
            queue.should.haveLogged([
                    'wall:select'
                  , 'wallselector:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'wallselector:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Selecting a Wall';

module.exports = features;
