/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module atom:tap:test-runner
 * @fileoverview Run TAP tests in Atom.
 */

'use strict';

/* eslint-env node, browser */

/* Dependencies. */
var util = require('util');
var through = require('through2');
var parser = require('tap-parser');
var glob = require('glob');
var tmp = require('tmp');
var debug = require('debug')('atom:tap:test-runner');

/* eslint-disable import/no-extraneous-dependencies */
var rProcess = require('electron').remote.process;
/* eslint-enable import/no-extraneous-dependencies */

/* Expose. */
module.exports = runner;

/**
 * Test files and catch their TAP output.
 */
function runner(params) {
  var globs = params.testPaths;

  /* Create an Atom. */
  global.atom = params.buildAtomEnvironment({
    applicationDelegate: params.buildDefaultApplicationDelegate(),
    configDirPath: tmp.dirSync().name,
    enablePersistence: true,
    document: document,
    window: window
  });

  return new Promise(function (resolve) {
    var evs = process._events;
    var exits = evs.exit;
    var exitCount;
    var timeout;
    var stdin;
    var tick;
    var tap;

    tap = parser(function (results) {
      resolve(results.ok ? 0 : 1);
    });

    /* Create a fake stream, which the things we require
     * will write their output to. */
    stdin = through();

    stdin.pipe(rProcess.stdout);

    stdin.pipe(tap);

    /* Listen for writes, and reset clock if they happen. */
    stdin.pipe(through(function (chunk, enc, callback) {
      tick();
      callback();
    }));

    /* Set fake outputs, cannot set normally. */
    Object.defineProperties(process, {
      stdout: {value: stdin},
      stderr: {value: rProcess.stderr}
    });

    console.log = log(process.stdout);
    console.error = debug.log = log(process.stderr);

    /* Listen for fatal errors, which we cannot in normal Node ways. */
    window.addEventListener('error', function () {
      /* No need to log the error, chromium will do that already. */
      resolve(1);
      return true;
    });

    /* Timeout. */
    timeout = process.env.TAP_TIMEOUT || 1000;

    debug('Using timeout: ' + timeout);

    /* Count current `exit` handlers used by Atom/Electron. */
    exitCount = exits.length;

    /* This callback is invoked when there wasn’t any output
     * by the tests for `timeout` milliseconds. So we end the
     * tests by faking `process.exit()`, as TAP harnesses often
     * bind to that event.  We also set the real `process.exit`
     * to a no-op, as that’s often also invoked by harnesses. */
    tick = delay(function () {
      var originals = exits.slice(0, exitCount);
      var fn = process.exit;

      evs.exit = exits.slice(exitCount);

      process.exit = function () {};
      process.emit('exit', 0);
      evs.exit = exits = originals;
      process.exit = fn;

      /* Finally, end the stream, so the tape parser ends
       * as well. */
      stdin.end();
    }, timeout);

    /* Load all tests. */
    globs.forEach(function (filePath) {
      glob(filePath, function (err, files) {
        if (err) {
          console.error(err.stack || err);
          resolve(1);
          return;
        }

        files.forEach(function (file) {
          tick();

          /* Require each file. */
          try {
            require(file);
          } catch (err) {
            console.error(err.stack || err);
            resolve(1);
          }
        });
      });
    });
  });
}

/* Fix `console.*` calls, they look horrible otherwise. */
function log(stream) {
  return function () {
    stream.write(util.format.apply(null, arguments) + '\n');
  };
}

/* Call `cb` after `timeout` ms of `tick` not being called. */
function delay(cb, timeout) {
  var id;

  return tick;

  function tick() {
    clearTimeout(id);

    id = setTimeout(function once() {
      cb();
      cb = function () {};
    }, timeout);
  }
}
