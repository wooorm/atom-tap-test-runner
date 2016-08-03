# atom-tap-test-runner

Since [atom/atom#8968][pr], it’s now possible to test projects in Atom
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
var test = require('tape');

test('atom', function (t) {
  t.plan(3);
  t.ok('loadTime' in atom, 'should have a `loadTime` prop');
  t.equal(typeof atom.loadTime, 'number', '`loadTime` should be a number');
  t.ok(atom.loadTime < 1000, '`loadTime` should be less than a second');
});
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
atom --test 'test/**/*.js' 'test.js'
```

The quotes are only needed if you want glob-supporting shells to
_not_ expand globs, and have [**glob**][glob] handle them instead.

###### `TAP_TIMEOUT`

Because Atom doesn’t `process.exit()`, **atom-tap-test-runner** simulates
the project exiting after a second of no output (`console.log` or
`process.stdout`).  This timeout can be changed by passing `TAP_TIMEOUT`:

```sh
TAP_TIMEOUT=5000 atom --test test.js
```

###### Chromium Logging

To remove Chromium logging, either uses [**silence-chromium**][silence-chromium]
(a good solution), or direct all **stderr**(4) output to `/dev/null`
(not a very good solution):

```sh
atom --test test.js 2> /dev/null
```

###### Formatters

Any [TAP reporters][reporters] works (be careful of exit codes though),
here’s an example of [**tap-difflet**][tap-difflet]:

```sh
atom --test test.js 2> silence-chromium | tap-difflet
```

Yields:

```txt
    Window load time: 769ms

  atom
    ✓ should have a `loadTime` prop
    ✓ `loadTime` should be a number
    ✓ `loadTime` should be less than a second

3 passing (3.1s)
```

###### Successful Output

If the tests succeeded, you’ll see something like this (the first two
lines are debugging from Electron/Atom):

```txt
[22204:0803/174406:WARNING:resource_bundle.cc(311)] locale_file_path.empty() for locale English
Window load time: 944ms
TAP version 13
# atom
ok 1 should have a `loadTime` prop
ok 2 `loadTime` should be a number
ok 3 `loadTime` should be less than a second

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
[22315:0803/175537:WARNING:resource_bundle.cc(311)] locale_file_path.empty() for locale English
Window load time: 1274ms
TAP version 13
# testing atom
It works!
ok 1 `atom` should have a `loadTime` prop
ok 2 `loadTime` should be a number
not ok 3 `loadTime` should be less than a second
  ---
    operator: ok
    expected: true
    actual:   false
    at: Test.<anonymous> (~/my-package/test.js:11:5)
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

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[pr]: https://github.com/atom/atom/pull/8968

[tap]: http://testanything.org

[tape]: https://github.com/substack/tape

[silence-chromium]: https://github.com/beaugunderson/silence-chromium

[successful]: #successful-output

[erroneous]: #erroneous-output

[reporters]: https://github.com/substack/tape#pretty-reporters

[tap-difflet]: https://github.com/namuol/tap-difflet

[glob]: https://www.npmjs.com/package/glob
