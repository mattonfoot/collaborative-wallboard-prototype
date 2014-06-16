function init( app ) {

    app.queue.on('pocket:regionenter', checkTransforms);

    function checkTransforms( data ) {
        var pocket = data.pocket
          , region = data.region;

        app.hypermedia.transform
            .search({})
            .then( applyTransforms( pocket, region ) );
    }

    function applyTransforms( pocket, region ) {
        return function( resources ) {
            resources.forEach(function( transform ) {
                var rules = transform.rules
                  , attr = rules.attr
                  , when = rules.when
                  , from = rules.from
                  , canApply = checkCanApplyTransform( region, when, from.selector );

                if ( canApply ) {
                    pocket[attr] = region[from.attr];

                    app.hypermedia.pocket.update( pocket );
                }
            });
        }
    }

    var filterMethods = {
        'string': function( region, filter ) {
            return region.id === filter.selector.replace('#', '');
        }
      , 'object': function( region, filter ) {
            var f = filter.selector;

            return region.links[f.node] === f.selector.replace('#', '');
        }
    };

    function checkCanApplyTransform( region, when, filter ) {
        if ( when.relationship === 'within' && when.filter === 'region' ) {
            if ( filter.node === 'region' ) {
                return filterMethods[typeof filter.selector]( region, filter );
            }
        }

        return false;
    }
}

module.exports = {
    init: init
}
