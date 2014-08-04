var chai = require('chai')
  , should = chai.should();

var queueChecked = false;

function features() {
    var services = this.application.services
      , scenarios = this.scenarios
      , queue = this.queue;

    before(function(done) {

        scenarios.multipleWalls()
            .then(function() {
                queue.clearCalls();

                done();
            });
    });

    it('If there are several walls configured then the Wall Selector input control will display all available walls\n',
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

features.title = 'Selecting a Wall from multiple';

module.exports = features;
