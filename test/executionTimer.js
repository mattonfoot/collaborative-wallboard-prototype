var hrtime = require('browser-process-hrtime');

function ExecutionTimer( object, label ) {
    for ( var key in object ) {
        wrapMethod.call( this, label, object, key );
    }

    ExecutionTimer.logs = {};
}

ExecutionTimer.process = function() {
    var logs = ExecutionTimer.logs, count = 0, stats = [];

    console.log( '\nSummary\n-------' );

    for (var label in logs) {
        var values = logs[ label ];

        values.forEach(addValues);

        var average = Math.round(count / values.length);

        stats.push({ label:label, count:values.length, average:average, values:values });

        count = 0;
    }

    stats.sort(function(a, b){
        return b.average - a.average;
    });

    stats.forEach(function(stat) {
        console.log( stat.label, stat.count, stat.average + 'ms' );
    });

    function addValues( val ) {
        count = count + val;
    }
};

function wrapMethod( label, object, propertyName ) {
    var original = object[ propertyName ], _this = this;

    if ( typeof( original ) !== 'function' ) return;

    object[ propertyName ] = function() {
        var start = hrtime();

        var output =  original.apply( object, arguments );

        if ( output.then ) {
            return output.then(function( resource ) {
                complete( label + '.' + propertyName + '.then(' + ( !!resource ? ' '+typeof( resource )+' ' : '' ) + ')', start );

                return resource;
            });
        }

        complete( label + '.' + propertyName + '(' + !!output + ')', start );

        return output;
    };
}

function complete( label, start ) {
    var timing = Math.round( hrtime( start )[1] / 1000000 );

    console.log( label, timing + 'ms' );

    ExecutionTimer.logs[ label ] = ExecutionTimer.logs[ label ] || [];
    ExecutionTimer.logs[ label ].push( timing );
}

module.exports = ExecutionTimer;
