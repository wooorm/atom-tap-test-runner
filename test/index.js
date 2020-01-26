'use strict'

var childProcess = require('child_process')
var promisify = require('util').promisify
var path = require('path')
var test = require('tape')

var exec = promisify(childProcess.exec)

test('success', function(t) {
  Promise.resolve()
    .then(function() {
      return exec('atom --test ' + relative('ok.js'))
    })
    .then(function(res) {
      t.deepEqual(
        res.stdout,
        [
          'TAP version 13',
          '# testing atom',
          'ok 1 `atom` should have a `loadTime` prop',
          'ok 2 `loadTime` should be a number',
          'ok 3 `loadTime` should be less than five seconds',
          '',
          '1..3',
          '# tests 3',
          '# pass  3',
          '',
          '# ok',
          '',
          ''
        ].join('\n'),
        'should report successes'
      )
    })
    .then(function() {
      return exec('atom --test ' + relative('nok.js'))
    })
    .catch(function(error) {
      var res = error.stdout
        .split('\n')
        .filter(filterStack)
        .join('\n')

      t.equal(
        res,
        [
          'TAP version 13',
          '# testing atom',
          'ok 1 `atom` should have a `loadTime` prop',
          'ok 2 `loadTime` should be a number',
          'not ok 3 `loadTime` should be bigger than five seconds',
          '  ---',
          '    operator: ok',
          '    expected: true',
          '    actual:   false',
          '    stack: |-',
          '      Error: `loadTime` should be bigger than five seconds',
          '  ...',
          '',
          '1..3',
          '# tests 3',
          '# pass  2',
          '# fail  1',
          '',
          ''
        ].join('\n'),
        'should report failures'
      )

      function filterStack(line) {
        return !/^\s+at/.test(line)
      }
    })
    .then(function() {
      t.end()
    })
})

function relative(filename) {
  return path.relative(process.cwd(), path.resolve(__dirname, filename))
}
