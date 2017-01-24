'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('matched');
var log = require('log-utils');
var union = require('arr-union');
var extend = require('extend-shallow');
var repeat = require('repeat-string');
var longest = require('longest');
var through = require('through2');
var File = require('vinyl');

module.exports = function(options) {
  var opts = extend({}, options);
  var cache = {utils: {}, methods: {}};
  var keys = getKeys(opts, cache);
  var report = {};

  if (!opts.utils && opts.keys) {
    keys.methods = opts.keys;
  }

  if (typeof keys.methods === 'undefined') {
    throw new Error('expected options.utils or options.keys to be defined');
  }

  return through.obj(function(file, enc, next) {
    var str = file.contents.toString();
    matchKeys(str, keys, cache.methods, report);
    next();
  }, function(next) {
    this.push(createReport(report, keys, opts));
    next();
  });
};

function getKeys(options, cache) {
  var opts = extend({cwd: process.cwd(), key: 'utils'}, options);
  var methods = [];
  var utils = [];

  if (!opts.utils) return {utils, methods};
  var files = glob.sync(opts.utils, options);
  var len = files.length;
  var idx = -1;

  while (++idx < len) {
    var fp = path.resolve(opts.cwd, files[idx]);
    methods = union([], methods, Object.keys(require(fp)));
    var str = fs.readFileSync(fp, 'utf8');
    var matches = matchUtils(str, opts.key, cache.utils);
    utils = union([], utils, matches);
  }
  return {utils, methods};
}

function matchUtils(str, key, cache) {
  var re = key;
  if (typeof re === 'string') {
    re = cache[key] || (cache[key] = new RegExp(`^${key}\\.(\\w+)`, 'gm'));
  }
  var matches = str.match(re) || [];
  return matches.map(function(name) {
    return name.replace(`${key}.`, '');
  });
}

function matchKeys(str, keys, cache, report) {
  keys.methods.forEach(function(key) {
    report[key] = report[key] || 0;
    var re = cache[key] || (cache[key] = new RegExp('\\.' + key, 'g'));
    var m = str.match(re);
    if (!m) return;
    var num = m.length;
    report[key] += num;
  });
  return report;
}

function createReport(report, keys, options) {
  var reportKeys = Object.keys(report);
  var unused = [];
  var res = {};

  for (var key in report) {
    if (report.hasOwnProperty(key)) {
      if (keys.utils.indexOf(key) !== -1) {
        report[key]--;
      }
    }
  }

  reportKeys.sort(function(a, b) {
    if (report[a] > report[b]) return -1;
    if (report[a] < report[b]) return 1;
    return 0;
  });

  reportKeys.forEach(function(key) {
    var val = report[key] - 1;
    res[key] = val;
    if (val === 0) {
      unused.push(key);
    }
  });

  res.unused = unused;
  var table = tablelize(res);

  var file = new File({
    path: 'report.js',
    contents: new Buffer(JSON.stringify(res, null, 2))
  });

  if (options.silent !== true) {
    console.log(table);
    console.log('TOTAL: ' + reportKeys.length);
  }

  file.table = table;
  file.report = res;
  return file;
}

function tablelize(obj) {
  var keys = Object.keys(obj);
  keys.unshift('Method');

  var len = longest(keys).length;
  var sep = repeat('-', len);
  keys.splice(1, 0, sep);

  obj.Method = 'Times used';
  obj[sep] = repeat('-', obj.Method.length);
  var table = '';

  keys.forEach(function(key) {
    var keyLen = key.length;
    var origKey = key;
    var val = obj[key];

    if (key === 'Method') {
      key = log.bold(key);
      val = log.bold(val);
    } else if (key === sep) {
      key = log.gray(key);
      val = log.gray(val);
    } else {
      key = log.cyan(key);
    }

    if (Array.isArray(val)) {
      table += log.gray(sep) + ' | ' + log.gray('---\n');
      val = '.' + val.join(', .') || 'none';
      key = log.bold(origKey);
    }

    table += key + repeat(' ', len - keyLen) + ' | ' + val;
    table += '\n';
  });

  return table;
}
