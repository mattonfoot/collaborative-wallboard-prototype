var chai = require('chai')
  , should = chai.should();

var storedName = 'display wall'
  , storedWall
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    before(function(done) {

        queue.once( 'boardcreator:displayed', function() {
            queue.clearCalls();

            done();
        });

        services.createWall({ name: storedName })
            .then(function( wall ) {
                storedWall = wall;
            });
    });

    it('Emit a <wall:display> event with a valid wall id to open the wall\n',
            function(done) {

        queue.trigger( 'wall:display', storedWall.getId() );

        queue.once( 'wall:displayed', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( storedName );

            resourceChecked = true;
        });

        queue.once( 'boardcreator:displayed', function() {
            queue.should.haveLogged([
                    'wall:display'
                  , 'wall:displayed'
                  , 'boardselector:displayed'
                  , 'wall:firsttime'
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

features.title = 'Displaying a wall';

module.exports = features;
