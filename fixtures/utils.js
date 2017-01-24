'use strict';

var utils = {};

utils.foo = function() {};
utils.bar = function() {
  return utils.foo();
};
utils.baz = function() {
  return utils.bar();
};
utils.aaa = function() {};
utils.bbb = function() {};
utils.ccc = function() {
  return utils.aaa();
};

module.exports = utils;
