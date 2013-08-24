'use strict';

var each = [].forEach
  , map = [].map;


function app() {
  var button = new DurationButton('#duration');
  button.initEventListeners();
}




/**
 * Class which controls duration block behavior
 *
 * @constructor
 * @param {string} id ID of HTML div.duration element
 */
function DurationButton(id) {
  var $el = $(id);

  if (!$el.length) throw new Error('No duration block found for #' + id);

  // socket.io connection
  this.io = io.connect();

  this.$input = $el.children('input');
  this.$browse = $el.children('button');
  this.$status = $el.children('span');
}


DurationButton.prototype.initEventListeners = function() {
  var self = this;

  this.$browse.click(function() {
    self.$input.click();
  });

  this.$input.change(function() {
    var files = $(this)[0].files;

    self.status('working');
    self.setFileList(files);
    self.requestDuration(files);
  });

  this.io.on('get data', function(name, range, fn) {
    console.log('Get data for ' + name + '[' + range.start + '-' + range.end + ']');

    var blob
      , file = self.files[name]
      , reader = new FileReader();

    if (range.end) {
      blob = file.slice(range.start, range.end);
    } else {
      blob = file;
    }

    reader.onload = function(e) {
      var buf = e.target.result;
      fn(null, buf);
    };

    reader.onerror = function(e) {
      fn(e);
    };

    reader.readAsBinaryString(blob);
  });
};


DurationButton.prototype.requestDuration = function(fileList) {
  var files = {}
    , self = this;

  each.call(fileList, function(file) {
    files[file.name] = file.size;
  });

  this.io.emit('get duration', files, function(err, duration) {
    if (err) self.status('error', err);
    else self.status('success', duration);
  });
};


DurationButton.prototype.setFileList = function(fileList) {
  var files = {};

  each.call(fileList, function(file) {
    files[file.name] = file;
  });

  this.files = files;
};


DurationButton.prototype.status = function(status, data) {
  this.$status.css('display', 'inline-block');

  if (status === 'working') {
    this.$status.html('<img src=\'/images/loading.gif\' alt=\'Loading...\' /> Working...');
  } else if (status === 'error') {
    this.$status.html('Error: ' + data);
  } else if (status === 'success') {
    var total = 0;
    data.forEach(function(info) {
      total += parseFloat(info.format.duration);
    });

    this.$status.html('Total duration is ' + Number(total).toFixed(2) + ' seconds.');
  }
};