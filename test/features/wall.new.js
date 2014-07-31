var chai = require('chai')
  , should = chai.should();

var resourceChecked = false
  , queueChecked = false;

function features() {
    var services = this.application.services
      , queue = this.queue;

    it('Emit a <wall:new> event - no data object is needed - to access an input control allowing you to enter details required to create a new Wall\n',
        function(done) {

            queue.trigger( 'wall:new' );

            queue.once( 'wallcreator:displayed', function( resource ) {
                should.not.exist( resource );

                resourceChecked = true;
            });

            queue.once( 'wallcreator:displayed', function() {
                queue.should.haveLogged([
                        'wall:new'
                      , 'wallcreator:displayed'
                    ]);

                queueChecked = true;
            });

            queue.once( 'wallcreator:displayed', function() {
                resourceChecked.should.equal( true );
                queueChecked.should.equal( true );

                done();
            });

        });

}

features.title = 'Accessing the wall creator input control';

module.exports = features;
