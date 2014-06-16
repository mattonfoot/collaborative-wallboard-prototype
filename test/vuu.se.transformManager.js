var should = require('chai').should();

function getHypermediaById( type, selector ) {
    var id = selector.replace('#', '');

    return app.hypermedia[ type ].get( id );
}

function selectNode( type, selector ) {
    if ( typeof selector === 'string' ) {
        return getHypermediaById( type, selector );
    }

    var parent = selector;
    return selectNode( parent.node, parent.selector );
}

var hypermedia = {

    region: [
        { id: 'region-abc-123', board: 'board-abc-123' }
      , { id: 'region-123-abc', board: 'board-abc-123' }
      , { id: 'region-cba-321', board: 'board-123-abc' }
      , { id: 'region-321-cba', board: 'board-123-abc' }
    ]

  , board: [
        { id: 'board-abc-123' }
      , { id: 'board-123-abc' }
    ]

}

var app = {
    hypermedia: {

        board: {
            get: function( id ) {
                return {
                    then: function( cb ){
                        var board = { id: '' };

                        hypermedia.board
                            .forEach(function( node ) {
                                if (node.id === id) {
                                    board = node;
                                }
                            });

                        cb( board.id );
                    }
                }
            }

          , search: function( ids ) {
                return {
                    then: function( cb ){
                        var boards = [];

                        hypermedia.board
                            .forEach(function( node ) {
                                if (node.id === id) {
                                    boards.push( node );
                                }
                            });

                        cb( boards );
                    }
                }
            }
        }

      , region: {
            get: function( id ) {
                return {
                    then: function( cb ){
                        var region = { id: '' };

                        hypermedia.region
                            .forEach(function( node ) {
                                if (node.id === id) {
                                    region = node;
                                }
                            });

                        cb( region.id );
                    }
                }
            }

          , search: function( ids ) {
                return {
                    then: function( cb ){
                        var regions = [];

                        hypermedia.region
                            .forEach(function( node ) {
                                if (node.id === id) {
                                    regions.push( node );
                                }
                            });

                        cb( regions );
                    }
                }
            }
        }

    }
};

describe('Given a region selector object', function() {
    var selector = {
        node: 'region'
      , selector: '#region-abc-123'
    };

    describe('When passed to the selector method', function() {

        var output = selectNode( selector.node, selector.selector );

        it('should call the correct hypermedia method', function() {
            output.then(function( id ) {
                id.should.equal( 'region-abc-123' );
            });
        });
    });
});

describe('Given a region selector object', function() {
    var selector = {
        node: 'region'
      , selector: { node: 'board' , selector: '#board-123-abc' }
    };

    describe('When passed to the selector method', function() {

        var output = selectNode( selector.node, selector.selector );

        it('should call the correct hypermedia method', function() {
            output.then(function( id ) {
                id.should.equal( 'board-123-abc' );
            });
        });
    });
});

describe('Given a board selector object', function() {
    var selector = {
        node: 'board'
      , selector: '#board-abc-123'
    };

    describe('When passed to the selector method', function() {

        var output = selectNode( selector.node, selector.selector );

        it('should call the correct hypermedia method', function() {
            output.then(function( id ) {
                id.should.equal( 'board-abc-123' );
            });
        });
    });
});
