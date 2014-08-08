
function TransformManager( queue, commands, queries ) {
    this._queue = queue;
    this._commands = commands;
    this._queries = queries;

    this._regionalcards = {};
}

TransformManager.prototype.checkTransforms = function( data ) {
    var pocket = data.pocket
      , region = data.region
      , _this = this;

    return this._queries.getAllTransforms()
        .then(function( resources ) {
            resources.forEach(function( transform ) {
                processTransform.call( _this, transform, pocket, region );
            });
        });
};

function processTransform( transform, pocket, region ) {
    var rules = transform.rules
      , attr = rules.attr
      , when = rules.when
      , from = rules.from
      , canApply = checkCanApplyTransform( region, when, from.selector )
      , _this = this;

    if ( canApply ) {
        pocket[attr] = region[from.attr];

        _this._commands.updatePocket( pocket )
            .then(function( pocket ) {
                _this._queue.emit( 'pocket:transformed', pocket );
            });
    }
}

function checkCanApplyTransform( region, when, filter ) {
    if ( when.relationship === 'within' && when.filter === 'region' && filter.node === 'region' ) {
        return filterMethods[typeof filter.selector]( region, filter );
    }

    return false;
}

var filterMethods = {
    'string': function( region, filter ) {
        var f = filter.selector;

        return region.getId() === filter.selector.replace('#', '');
    }
  , 'object': function( region, filter ) {
        var f = filter.selector;

        return region[f.node] === f.selector.replace('#', '');
    }
};

module.exports = TransformManager;
