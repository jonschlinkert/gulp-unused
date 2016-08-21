'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var assert = require('assert');
var vars = require('./');

var cwd = path.resolve.bind(path, __dirname, 'fixtures');

describe('vars()', function() {
  it('should create report.js', function(cb) {
    var stream = vars({keys: Object.keys(require(cwd('utils.js'))), silent: true});
    var buffer = [];

    stream.write(new File({
      base: cwd(),
      path: cwd('main.js'),
      contents: fs.readFileSync(cwd('main.js'))
    }));

    stream.on('data', function(file) {
      buffer.push(file);
    });

    stream.on('end', function() {
      assert.equal(buffer.length, 1);
      assert.equal(buffer[0].basename, 'report.js');
      cb();
    });
    stream.end();
  });

  it('should add a report property to file', function(cb) {
    var stream = vars({keys: Object.keys(require(cwd('utils.js'))), silent: true});
    var buffer = [];

    stream.write(new File({
      base: cwd(),
      path: cwd('main.js'),
      contents: fs.readFileSync(cwd('main.js'))
    }));

    stream.on('data', function(file) {
      buffer.push(file);
    });

    stream.on('end', function() {
      assert(buffer[0].hasOwnProperty('report'));
      cb();
    });
    stream.end();
  });

  it('should create a report with the number of times each "key" is used', function(cb) {
    var stream = vars({keys: Object.keys(require(cwd('utils.js'))), silent: true});
    var buffer = [];

    stream.write(new File({
      base: cwd(),
      path: cwd('main.js'),
      contents: fs.readFileSync(cwd('main.js'))
    }));

    stream.on('data', function(file) {
      buffer.push(file);
    });

    stream.on('end', function() {
      assert.equal(buffer[0].report.foo, 3);
      assert.equal(buffer[0].report.bar, 2);
      assert.equal(buffer[0].report.ccc, 1);
      assert.equal(buffer[0].report.baz, 1);
      assert.equal(buffer[0].report.bbb, 0);
      assert.equal(buffer[0].report.aaa, 0);
      assert.deepEqual(buffer[0].report.unused, ['bbb', 'aaa']);
      cb();
    });
    stream.end();
  });
});
