'use strict';

/* global atom */
var test = require('tape');

test('testing atom', function (t) {
  t.plan(3);

  t.ok('loadTime' in atom, '`atom` should have a `loadTime` prop');
  t.equal(typeof atom.loadTime, 'number', '`loadTime` should be a number');
  t.ok(atom.loadTime < 10000, '`loadTime` should be less than five seconds');
});
