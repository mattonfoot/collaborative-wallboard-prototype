function FakeDB() {
  this.constructor = FakeDB;

  this.reset();
}

FakeDB.prototype.reset = function() {
  this.docs = [];
};

FakeDB.prototype.allDocs = function() {
  var docs = this.docs;

  return new Promise(function( resolve, reject ) {
    var out = {
      offset: 0,
      rows: docs.map(function( doc ) {
        return {
          doc: doc,
          id: doc._id,
          key: doc._id,
          value: doc._rev
        };
      }),
      total_rows: docs.length
    };

    resolve( out );
  });
};

FakeDB.prototype.put = function( doc ) {
  var docs = this.docs;

  return new Promise(function( resolve, reject ) {
    docs.push( doc );

    resolve({ id: doc._id, rev: new Date().getTime() });
  });
};

FakeDB.prototype.initialise = function( docs ) {
  this.docs = docs;
};









module.exports = FakeDB;
