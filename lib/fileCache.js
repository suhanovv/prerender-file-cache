/**
 * Created by vsuhanov on 21.04.14.
 */

var cache_manager = require('cache-manager');
var fs = require('node-fs');

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
                var now = new Date();
                console.log(now.toDateString() +' ' + now.toTimeString() + ' cache hit');
                res.send(200, result);
            } else {
                next();
            }
        });
    },

    afterPhantomRequest: function(req, res, next) {
        if (req.prerender.statusCode == 200) {
            this.cache.set(req.prerender.url, req.prerender.documentHTML);
        }
        next();
    }
};


var file_cache = {
    get: function(key, callback) {
        var path = process.env.CACHE_ROOT_DIR;
        var cache_live_time = process.env.CACHE_LIVE_TIME;

        var filename = '___';
        var request_url = key.split('#!')[1];

        if(typeof request_url !== "undefined") {
            path = path + request_url + '/' + filename;
        } else {
            path = path + '/' + filename;
        }

        fs.exists(path, function(exists){
            if (exists === false) {
                return callback(null)
            }

            var date = new Date();

            if (date.getTime() - fs.statSync(path).mtime.getTime() > cache_live_time * 1000) {
                return callback(null)
            }

            fs.readFile(path, callback);

        });

    },
    set: function(key, value, callback) {

        var path = process.env.CACHE_ROOT_DIR;
        var filename = '___';

        var request_url = key.split('#!')[1];

        if(typeof request_url !== "undefined") {
            path = path + request_url;
        }

        fs.exists(path, function(exists){
            if (exists === false) {
                fs.mkdirSync(path, '0777',true);
            }
            fs.writeFile(path + '/' + filename, value, callback);

        });

    }
};


