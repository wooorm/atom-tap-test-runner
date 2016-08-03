var path = require('path');
var test = require('tape');
var execa = require('execa');

test('success', function (t) {
  t.plan(2);

  execa('atom', ['--test', relative('ok.js')]).then(function (res) {
    t.equal(
      clean(res.stdout),
      [
        'Window load time: ???ms',
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
        ''
      ].join('\n'),
      'should report successes'
    );
  });

  execa('atom', ['--test', relative('nok.js')]).catch(function (err) {
    t.equal(
      clean(err.stdout),
      [
        'Window load time: ???ms',
        'TAP version 13',
        '# testing atom',
        'ok 1 `atom` should have a `loadTime` prop',
        'ok 2 `loadTime` should be a number',
        'not ok 3 `loadTime` should be bigger than five seconds',
        '  ---',
        '    operator: ok',
        '    expected: true',
        '    actual:   false',
        '    at: Test.<anonymous> (/Users/tilde/projects/oss/atom-tap-test-runner/test/nok.js:9:5)',
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
    );
  });
});

function clean(value) {
  return value.replace(/\d{2,}ms/, '???ms');
}

function relative(filename) {
  return path.relative(process.cwd(), path.resolve(__dirname, filename));
}
