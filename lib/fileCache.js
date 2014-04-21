/**
 * Created by vsuhanov on 21.04.14.
 */

var cache_manager = require('cache-manager');
var fs = require('fs');

module.exports = {
    init: function() {
        this.cache = cache_manager.caching({
            store: file_cache
        });
    },

    beforePhantomRequest: function(req, res, next) {
        if(req.method !== 'GET') {
            return next();
        }

        this.cache.get(req.prerender.url, function (err, result) {
            if (!err && result) {
                console.log('cache hit');
                res.send(200, result);
            } else {
                next();
            }
        });
    },

    afterPhantomRequest: function(req, res, next) {
        this.cache.set(req.prerender.url, req.prerender.documentHTML);
        next();
    }
};


var file_cache = {
    get: function(key, callback) {
        root_path = process.env.CACHE_ROOT_DIR;
        cache_live_time = process.env.CACHE_LIVE_TIME;

        filename = '___';

        path = root_path + key.split('#!')[1] + '/' + filename;

        fs.exists(path, function(exists){
            if (exists === false) {
                return callback(null)
            }

            date = new Date();

            if (date.getTime() - fs.statSync(path).mtime.getTime() > cache_live_time * 1000) {
                return callback(null)
            }

            fs.readFile(path, callback);

        });

    },
    set: function(key, value, callback) {

        root_path = process.env.CACHE_ROOT_DIR;
        filename = '___';

        path = root_path + key.split('#!')[1];

        fs.exists(path, function(exists){
            if (exists === false) {
                fs.mkdirSync(path);
            }
            fs.writeFile(path + '/' + filename, value, callback);

        });

    }
};


