(function () {
    "use strict";

    function Factory( io, options ) {

        function EventQueue( options ) {
            var eq = function() {
                this.options = options || {};

                this.events = {};
            }

            eq.prototype = EventQueue.prototype;

            return new eq();
        }

        EventQueue.prototype.on = function( ev, reaction ) {
            if (!this.events[ev]) {
                this.events[ev] = [];
            }

            this.events[ev].push( reaction );

            io.sockets.on( ev, reaction );

            return this;
        };

        EventQueue.prototype.emit = function( ev, data ) {
            console.log( ev, data );

            if (this.events[ev]) {
                this.events[ev].forEach(function( react ) {
                    react( data );
                });
            }

            io.sockets.emit( ev, data );

            return this;
        };

        return new EventQueue( options );
    }

    // export as AMD module / Node module / browser variable
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Factory;
        });
    } else if (typeof module !== 'undefined') {
        module.exports = Factory;
    } else {
        window.vuu = window.vuu || { se: {} };

        window.vuu.se.eventqueue = Factory;
    }

})();
