'use strict';

var through = require('through2');
var File = require('vinyl');

module.exports = function(options) {
  options = options || {};

  if (!Array.isArray(options.keys) || options.keys.length === 0) {
    throw new Error('expected options.keys to be an array of property names');
  }

  var keys = options.keys;
  var report = {};
  var cache = {};

  return through.obj(function(file, enc, next) {
    var str = file.contents.toString();
    keys.forEach(function(key) {
      report[key] = report[key] || 0;
      var re = cache[key] || (cache[key] = new RegExp('\\.' + key, 'g'));
      var m = str.match(re);
      if (!m) return;
      report[key] += m.length;
    });

    next();
  }, function(next) {
    this.push(createReport(report, options));
    next();
  });
};

function createReport(report, options) {
  var keys = Object.keys(report);
  var res = {};
  var unused = [];

  keys.sort(function(a, b) {
    return report[a] > report[b] ? -1 : 1;
  });

  keys.forEach(function(key) {
    var val = report[key];
    res[key] = val;
    if (val === 0) {
      unused.push(key);
    }
  });


  res.unused = unused;
  var file = new File({
    path: 'report.js',
    contents: new Buffer(JSON.stringify(res, null, 2))
  });

  if (options.silent !== true) {
    console.log(res);
    console.log('TOTAL: ' + keys.length);
  }

  file.report = res;
  return file;
}
