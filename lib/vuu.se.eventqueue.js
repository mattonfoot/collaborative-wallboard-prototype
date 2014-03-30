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

module.exports = Factory;
