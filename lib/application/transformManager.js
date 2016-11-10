
const filterMethods = {
  'string': (region, filter) => {
    return region.getId() === filter.selector.replace('#', '');
  },
  'object': (region, filter) => {
    return region.getProperty( filter.selector.node ) === filter.selector.selector.replace('#', '');
  },
};

function TransformManager( queue, repository ) {
  var transformManager = this;
  this.queue = queue;
  this.repository = repository;

  queue.subscribe( 'card.regionentered', function( data ) {
    transformManager.applyTransforms( data );
  });

  queue.subscribe( 'card.regionexited', function( data ) {
    transformManager.undoTransforms( data );
  });
}

TransformManager.prototype.applyTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region, card;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card );
    })
    .then(function( resource ) {
      card = resource;

      return repository.getWall( card.getWall() );
    })
    .then(function( wall ) {

    return repository.getViews( wall.getViews() );
  })
  .then(function( views ) {

      var transformids = [];
      views.forEach(function( view ) {
        transformids = transformids.concat( view.getTransforms() );
      });

      return repository.getTransforms( transformids );
    })
    .then(function( transforms ) {
      transforms.forEach(function( transform ) {
          processTransform( queue, 'set', transform, card, region );
      });
    });
};

TransformManager.prototype.undoTransforms = function( data ) {
  var queue = this.queue;
  var repository = this.repository;

  var region, card;
  return repository.getRegion( data.region )
    .then(function( resource ) {
      region = resource;

      return repository.getCard( data.card );
    })
    .then(function( resource ) {
      card = resource;

      return repository.getWall( card.getWall() );
    })
    .then(function( wall ) {

    return repository.getViews( wall.getViews() );
  })
  .then(function( views ) {

      var transformids = [];
      views.forEach(function( view ) {
        transformids = transformids.concat( view.getTransforms() );
      });

      return repository.getTransforms( transformids );
    })
    .then(function( transforms ) {
      transforms.forEach(function( transform ) {
          processTransform( queue, 'unset', transform, card, region );
      });
    });
};

function processTransform( queue, op, transform, card, region ) {
  var rules = transform.getRules()
    , attr = rules.attr
    , when = rules.when
    , from = rules.from
    , canApply = checkCanApplyTransform( region, when, from.selector );

  if ( canApply ) {
    card.transform({ view: transform.view, op: op, property: attr, value: region.getProperty( from.attr ) });
  }
}

function checkCanApplyTransform( region, when, filter ) {
  if ( when.relationship === 'within' && when.filter === 'region' && filter.node === 'region' ) {
    return filterMethods[ typeof filter.selector ]( region, filter );
  }

  return false;
}

module.exports = TransformManager;
