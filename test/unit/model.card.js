var chai = require('chai');
var should = chai.should();
var Card = require('../../lib/application/models/card.js');

function features() {
  var queue = {
    subscribe: function() {},
    publish: function() {},
  };

  var wallId = 'card-test-wall';
  var viewId = 'card-test-view';

  it('can be created\n', function() {
    var card = Card.constructor({
      wall: wallId,
    }, queue );

    should.exist( card );
    card.getWall().should.equal( wallId );
  });

  it('is uniquely identified from other cards\n', function() {
    var card1 = Card.constructor({
      wall: wallId,
    }, queue );
    var card2 = Card.constructor({
      wall: wallId,
    }, queue );

    card1.getId().should.not.equal( card2.getId() );
  });

  it('can be placed within a view\n', function() {
    var card = Card.constructor({
      wall: wallId,
      view: viewId,
      x: 100,
      y: 50,
    }, queue );

    var pos = card.getPosition( viewId );

    pos.x.should.equal( 100 );
    pos.y.should.equal( 50 );
  });

  it('can be moved\n', function() {
    var card = Card.constructor({
      wall: wallId
    }, queue );

    var pos = card.getPosition( viewId );

    card.move({
      view: viewId,
      x: 100,
      y: 50,
    });

    var newPos = card.getPosition( viewId );

    pos.x.should.not.equal( newPos.x );
    pos.y.should.not.equal( newPos.y );
  });

  it('can report on its center\n', function() {
    var card = Card.constructor({
      wall: wallId
    }, queue );

    card.move({
      view: viewId,
      x: 0,
      y: 0,
    });

    var center = card.getCentre( viewId );

    center.x.should.equal( 0 );
    center.y.should.equal( 0 );
  });
}

features.title = 'Event sourced card models';

module.exports = features;
