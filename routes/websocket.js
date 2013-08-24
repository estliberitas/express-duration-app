'use strict';

var spawn = require('child_process').spawn;


/**
 * Add routes to Express app
 *
 * @param {express} app
 * @param {socket.io} io
 */
module.exports = function(app, io) {
  io.clients = {};
  io.sockets.on('connection', connectionListener);


  function connectionListener(socket) {
    io.clients[socket.id] = socket;

    socket.on('get duration', requestDuration);
    socket.on('disconnect', disconnectListener);
  }


  function requestDuration(list, fn) {
    var socket = this
      , filenames = Object.keys(list);

    socket.files = list;

    each(filenames, function iterator(fileName, callback) {
      var args = ['-print_format', 'json=c=1', '-show_streams', '-show_format']
        , url = [];

      url.push('http://127.0.0.1:' + app.get('port'));
      url.push('/data/', socket.id);
      url.push('/', fileName);

      args.push(url.join(''));

      var probe = spawn('ffprobe', args)
        , out = ''
        , err = '';

      probe.stdout.on('data', function(data) {
        out += data;
      });

      probe.stderr.on('data', function(data) {
        err += data;
      });

      probe.on('error', function(err) {
        callback(err);
      });

      probe.on('close', function(code) {
        if (code) {
          callback(err);
        } else {
          try {
            var data = JSON.parse(out);
            callback(null, data);
          } catch(ex) {
            callback(ex);
          }
        }
      });
    }, fn);
  }


  function disconnectListener() {
    delete io.clients[this.id];
  }
};




/**
 * Asynchronously iterates over given map of uploaded files data
 *
 * @param {Array} array
 * @param {Function} iterator Takes following args (key, value, callback)
 * @param {Function} callback Takes following args (err, results)
 */
function each(array, iterator, callback) {
  var error
    , pending = array.length
    , results = new Array(array.length);

  function done(err, result, idx) {
    if (err) {
      if (error) return;

      error = err;
      callback(err, null);
      return;
    }

    results[idx] = result;

    if (!--pending) {
      callback(null, results);
    }
  }

  array.forEach(function(val, idx) {
    process.nextTick(function() {
      var called = false;

      iterator(val, function(err, result) {
        if (called) return;
        called = true;

        done(err, result, idx);
      });
    });
  });
}