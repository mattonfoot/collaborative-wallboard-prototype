module.exports = function() {

    return {

        coverage: {
            src:    [ 'lib/' ],
            dest:   'coverage/lib/'
        }

      , features: {
            src:    [ 'test/lib/' ],
            dest:   'coverage/test/lib/'
        }

    };

};
