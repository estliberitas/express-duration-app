'use strict';

var mime = require('mime')
  , rangeParse = require('range-parser')
  , Readable = require('stream').Readable
  , util = require('util');




/**
 * @param {new.Socket} socket
 * @param {string} filename
 * @param {object} options
 * @constructor
 */
function SocketFileReader(socket, filename, options) {
  options = options || {};

  if (!(this instanceof SocketFileReader)) {
    return new SocketFileReader(socket, filename, options);
  }

  Readable.call(this, options);

  this.socket = socket;
  this.filename = filename;
  this.pos = options.start;
  this.end = options.end;
  this.destroyed = false;
}
util.inherits(SocketFileReader, Readable);




/**
 * Size of chunk to read from socket
 *
 * @type {number}
 */
SocketFileReader.prototype.BUFFER_SIZE = 256*1024;




/**
 * Implementation of {Readable._read}
 *
 * @see {}
 * @private
 */
SocketFileReader.prototype._read = function() {
  if (this.destroyed) {
    return;
  } else if (this.pos >= this.end) {
    return this.push(null);
  }

  var range = {start: this.pos, end: this.pos + this.BUFFER_SIZE}
    , self = this;

  if (range.end > this.end) {
    range.end = this.end;
  }

  self.pos += (range.end - range.start);

  this.socket.emit('get data', this.filename, range, function ondata(err, data) {
    if (err) return self.emit('error', err);
    self.push(data, 'binary');
  });
};




/**
 * Mark stream as destroyed to stop reading
 */
SocketFileReader.prototype.destroy = function() {
  if (this.destroyed) return;
  this.destroyed = true;
};




/**
 * Add routes to Express app
 *
 * @param {express} app
 * @param {socket.io} io
 */
module.exports = function(app, io) {
  app.get('/', function requestIndex(req, res) {
    res.render('index');
  });


  app.get('/data/:id/:file', function requestIndex(req, res) {
    var rawRange = req.get('range') || 'bytes=0-'
      , socket = io.clients[req.params.id]
      , filename = req.params.file
      , size = socket.files[filename]
      , range = rangeParse(size, rawRange)[0];

    var type = mime.lookup(req.params.file)
      , charset = mime.charsets.lookup(type);

    if (charset) {
      type += '; charset=' + charset;
    }

    res.set('Accept-Ranges', 'bytes');
    res.set('Connection', 'close');
    res.set('Content-Type', type);
    res.set('Content-Length', range.end - range.start);
    res.set('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + size);
    res.statusCode = 206;

    var stream = new SocketFileReader(socket, filename, range);
    stream.pipe(res);
    stream.on('error', function(err) {
      res.send(500, err.toString());
    });

    req.on('close', stream.destroy.bind(stream));
  });
};