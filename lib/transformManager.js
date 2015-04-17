
function TransformManager( queue, queries ) {
  var manager = this;
    this._queue = queue;
    this._queries = queries;

    this._regionalcards = {};

    queue.on( 'pocket:regionenter', function( data ) {
        if (!_this._listen) return;

        manager.checkTransforms( data )
          .catch(function( error ) {
            queue.publish( 'pocket:regionenter:fail', error );
          });
    });

    queue.on( 'pocket:regionexit', function( data ) {
        if (!_this._listen) return;

        manager.checkTransforms( data )
          .catch(function( error ) {
            queue.publish( 'pocket:regionexit:fail', error );
          });
    });
}

TransformManager.prototype.checkTransforms = function( data ) {
  var manager = this;
  var card = data.pocket;
  var region = data.region;

  card.color = region.getColor();

  manager._queue.emit( 'pocket:transformed', card );

/*
    return this._queries.getAllTransforms()
        .then(function( resources ) {
            resources.forEach(function( transform ) {
                processTransform.call( _this, transform, pocket, region );
            });
        });
*/
};
/*
function processTransform( transform, pocket, region ) {
    var rules = transform.rules
      , attr = rules.attr
      , when = rules.when
      , from = rules.from
      , canApply = checkCanApplyTransform( region, when, from.selector )
      , _this = this;

    if ( canApply ) {
        pocket[attr] = region[from.attr];

        _this._queue.emit( 'pocket:transformed', pocket );
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
*/
module.exports = TransformManager;
