# atom-tap-test-runner [![Build Status][travis-badge]][travis]

Since [atom/atom#8968][pr], it’s possible to test projects in Atom
without needing to use Jasmine.  Time for Tap!

This project runs [TAP][] producing test files in an environment with
`atom` available.

## Installation

[npm][]:

```bash
npm install atom-tap-test-runner --save-dev
```

## Usage

Add the following line to your `package.json`:

```diff
 {
   "name": "my-package",
   // ...
+  "atomTestRunner": "atom-tap-test-runner",
   // ...
 }
```

Then, add a [TAP][]-producing test file, such as the following
`test.js` (note: I like [tape][], but you can use whatever):

```js
var test = require('tape')

test('atom', function(t) {
  t.plan(3)
  t.ok('loadTime' in atom, 'should have a `loadTime` prop')
  t.equal(typeof atom.loadTime, 'number', '`loadTime` should be a number')
  t.ok(atom.loadTime < 1000, '`loadTime` should be less than a second')
})
```

Now, to run your tests, run the following in your shell:

```sh
atom --test test.js
```

Depending on how fast Atom started, you’ll see [successful][] or
[erroneous][] output.

## API

There’s not much API.  There’s the `atom` global added to the global
scope.

###### Multiple files

Passing globs, or multiple files, can be done like so:

```sh
atom --test "test/**/*.js" "test.js"
```

The quotes are only needed if you want glob-supporting shells to
_not_ expand globs, and have [**glob**][glob] handle them instead.

###### `TAP_TIMEOUT`

Because Atom doesn’t `process.exit()`, **atom-tap-test-runner** simulates
the project exiting after a second of no output (`console.log` or
`process.stdout`).  This timeout can be changed by setting `TAP_TIMEOUT`:

```sh
TAP_TIMEOUT=5000 atom --test test.js
```

###### Formatters

Any [TAP reporters][reporters] works (be careful of exit codes though),
here’s an example of [**tap-difflet**][tap-difflet]:

```sh
atom --test test.js | tap-difflet
```

Yields:

```txt
  testing atom
    ✓ `atom` should have a `loadTime` prop
    ✓ `loadTime` should be a number
    ✓ `loadTime` should be less than five seconds

3 passing (4.2s)
```

###### Successful Output

If the tests succeeded, you’ll see something like this:

```txt
# testing atom
ok 1 `atom` should have a `loadTime` prop
ok 2 `loadTime` should be a number
ok 3 `loadTime` should be less than five seconds

1..3
# tests 3
# pass  3

# ok
```

...and the exit code:

```sh
echo $?
```

Yields (0 is OK):

```txt
0
```

###### Erroneous Output

If the tests failed, you’ll see something like this (the first two
lines are debugging from Electron/Atom):

```txt
TAP version 13
# testing atom
ok 1 `atom` should have a `loadTime` prop
ok 2 `loadTime` should be a number
not ok 3 `loadTime` should be bigger than five seconds
  ---
    operator: ok
    expected: true
    actual:   false
    at: Test.<anonymous> (~/my-package/test.js:11:5)
    stack: |-
      Error: `loadTime` should be bigger than five seconds
          at Test.assert [as _assert] (~/my-package/node_modules/tape/lib/test.js:226:54)
          at Test.bound [as _assert] (~/my-package/node_modules/tape/lib/test.js:77:32)
          at Test.assert (~/my-package/node_modules/tape/lib/test.js:344:10)
          at Test.bound [as ok] (~/my-package/node_modules/tape/lib/test.js:77:32)
          at Test.<anonymous> (~/my-package/test/nok.js:11:5)
          at Test.bound [as _cb] (~/my-package/node_modules/tape/lib/test.js:77:32)
          at Test.run (~/my-package/node_modules/tape/lib/test.js:96:10)
          at Test.bound [as run] (~/my-package/node_modules/tape/lib/test.js:77:32)
          at Immediate.next (~/my-package/node_modules/tape/lib/results.js:75:19)
          at runCallback (timers.js:789:20)
          at tryOnImmediate (timers.js:751:5)
          at processImmediate [as _immediateCallback] (timers.js:722:5)
  ...

1..3
# tests 3
# pass  2
# fail  1
```

...and the exit code:

```sh
echo $?
```

Yields (1 is not OK):

```txt
1
```

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/atom-tap-test-runner.svg

[travis]: https://travis-ci.org/wooorm/atom-tap-test-runner

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[pr]: https://github.com/atom/atom/pull/8968

[tap]: https://testanything.org

[tape]: https://github.com/substack/tape

[successful]: #successful-output

[erroneous]: #erroneous-output

[reporters]: https://github.com/substack/tape#pretty-reporters

[tap-difflet]: https://github.com/namuol/tap-difflet

[glob]: https://www.npmjs.com/package/glob
