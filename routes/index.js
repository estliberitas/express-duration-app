'use strict';

var fs = require('fs')
  , path = require('path');


module.exports = function(app, io) {
  fs.readdirSync(__dirname).forEach(function(filename) {
    if (filename === 'index.js') return;

    var modulePath = path.join(__dirname, filename);
    require(modulePath)(app, io);
  });
};