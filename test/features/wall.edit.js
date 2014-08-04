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

    it('Emit a <wall:edit> event with a valid wall id to access an input control allowing you to enter new details for a Wall\n',
            function(done) {

        queue.trigger( 'wall:edit', storedWall.getId() );

        queue.once( 'walleditor:displayed', function() {
            queue.should.haveLogged([
                    'wall:edit'
                  , 'walleditor:displayed'
                ]);

            queueChecked = true;
        });

        queue.once( 'walleditor:displayed', function() {
            queueChecked.should.equal( true );

            done();
        });

    });

}

features.title = 'Accessing the wall editor input control';

module.exports = features;
