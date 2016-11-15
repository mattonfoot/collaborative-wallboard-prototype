var chai = require('chai');
var should = chai.should();
var Wall = require('../../lib/application/models/wall.js');

function features() {
  it('can be created\n', function() {
    var queue = {
      subscribe: function() {}
    };
    var wall = new Wall({
      name: 'test wall',
    }, queue );

    should.exist( wall );
  });
}

features.title = 'Event sourced wall models';

module.exports = features;
