

function EventQueue( options ) {
    this.options = options || {};

    this.events = {};
}

EventQueue.prototype.on = function( ev, reaction, once ) {
    if (!this.events[ev]) {
        this.events[ev] = [];
    }

    this.events[ev].push( { reaction: reaction, once: !!once } );

    return this;
};

EventQueue.prototype.once = function( ev, reaction ) {
    return this.on( ev, reaction, true );
};

EventQueue.prototype.emit = function( ev, data ) {
    var options = this.options;

    if (options.debug) {
        console.log( 'EventQueue.emit('+ ev +')', ( data && data.getId) ? 'getId:' + data.getId() : ( data && data.id) ? 'id:'+data.id : typeof( data ) );
    }

    if (this.events[ev]) {
        var cleansed = [];

        this.events[ev].forEach(function( react ) {
            setTimeout(function() {
                react.reaction( data );
            }, 0);

            if (!react.once) {
                cleansed.push( react );
            }
        });

        this.events[ev] = cleansed;
    }

    return this;
};

EventQueue.prototype.clearAll = function() {
    this.events = {};
};

EventQueue.prototype.trigger = function( ev, data ) {
    this.emit( ev, data );
};

module.exports = EventQueue;
