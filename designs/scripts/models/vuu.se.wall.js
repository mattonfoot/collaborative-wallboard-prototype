
// event <--

// event -->

define(function() {

    var Wall = (function() {

        // constructor

        function Wall( queue, data ) {
            var wall = this;

            wall.id = data.id;
            wall.links = wall.links || {};

            wall.links.boards = [];
            wall.links.pockets = [];

            var activeboard;

            // private

            function __activateBoard( board ) {
                if ( !board ) {
                    return false;
                }

                if ( activeboard && activeboard.id !== board.id && !activeboard.deactivate() ) {
                    return false; // failed to deactive current active board
                }

                if ( board.activate() ) {
                    activeboard = board;

                    return true;
                }
            }

            // public functions

            wall.getId = function() {
                return wall.id;
            };

            wall.addBoard = function( board ) {
                if ( wall.getBoardById( data.id ) ) {
                    return false; // we already have it
                }

                wall.links.boards.push( board );

                if (!activeboard) {
                    wall.setActiveBoard();
                }

                return true;
            };

            wall.getBoard = function( index ) {
                return wall.links.boards[ index ];
            };

            wall.getBoardById = function( id ) {
                var result;

                wall.links.boards.forEach(function( board ) {
                    if ( board.getId() == id ) {
                        result = board;
                    }
                });

                return result;
            };

            wall.setActiveBoard = function( index ) {
                index = index || 0;
                var len = wall.links.boards.length;

                if ( index >= len || index < 0 ) {
                    return wall;
                }

                __activateBoard( wall.links.boards[ index ] );

                return wall
            };

            wall.setActiveBoardById = function( id ) {
                var board;
                wall.links.boards.forEach(function( b ) {
                    if (b.id == id) {
                        board = b;
                    }
                });

                __activateBoard( board );

                return wall;
            };

            wall.getActiveBoard = function() {
                return activeboard;
            };

            wall.addPocket = function( pocket ) {
                wall.links.pockets.push( pocket );

                return wall;
            };

            wall.getPocket = function( index ) {
                return wall.links.pockets[ index ];
            };

            wall.getPocketById = function( id ) {
                var result;

                wall.links.pockets.forEach(function( pocket ) {
                    if ( pocket.getId() == id ) {
                        result = pocket;
                    }
                });

                return result;
            };

            // instance

            return wall;
        }

        // Factory

        return Wall;

    })();

    // export

    return Wall;

});
