var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false
  , storedName = 'unedited wall'
  , editedName = 'edited wall'
  , storedWall;

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

    it('Emit a <wall:update> event passing an updated data object with a valid wall id trigger the process of updating the stored data for an existing wall\n',
            function(done) {

        storedWall.name = editedName;
        
        queue.trigger( 'wall:update', storedWall );

        queue.once( 'wall:updated', function( resource ) {
            should.exist( resource );

            resource.should.be.a.specificWallResource( editedName );
            resource.getId().should.equal( storedWall.getId() );

            resourceChecked = true;
        });

        queue.once( 'wall:updated', function() {
            queue.should.haveLogged([
                    'wall:update'
                  , 'wall:updated'
                ]);

            queueChecked = true;
        });

        queue.once( 'wall:updated', function() {
            resourceChecked.should.equal( true );
            queueChecked.should.equal( true );

            done();
        });
    });

}

features.title = 'Updating a wall';

module.exports = features;
