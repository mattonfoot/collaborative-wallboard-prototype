var chai = require('chai')
  , should = chai.should();

var storedName = 'new wall'
  , resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    it('Emit a <wall:create> event passing a data object with a name attribute to trigger the process of creating a new wall\n',
        function( done ) {

            queue.trigger( 'wall:create', { name: storedName } );

            queue.once( 'wall:created', function( resource ) {
                should.exist( resource );

                resource.should.be.a.specificWallResource( storedName );

                resourceChecked = true;
            });

            queue.once( 'boardcreator:displayed', function() {
                queue.should.haveLogged([
                        'wall:create'
                      , 'wall:created'
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

features.title = 'Creating a wall';

module.exports = features;
