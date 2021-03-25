'use strict'

/* eslint-env node, browser */

var format = require('util').format
var rProcess = require('electron').remote.process
var through = require('through2')
var Parser = require('tap-parser')
var glob = require('glob')
var tmp = require('tmp')
var debug = require('debug')('atom:tap:test-runner')

module.exports = runner

// Test files and catch their TAP output.
function runner(parameters) {
  var globs = parameters.testPaths

  // Create an Atom.
  global.atom = parameters.buildAtomEnvironment({
    applicationDelegate: parameters.buildDefaultApplicationDelegate(),
    configDirPath: tmp.dirSync().name,
    enablePersistence: true,
    document: document,
    window: window
  })

  return new Promise(executor)

  function executor(resolve) {
    var evs = process._events
    var exits = evs.exit
    var exitCount
    var timeout
    var stdin
    var tick
    var index

    // Create a fake stream, which the things we require will write their output
    // to.
    stdin = through()

    // Write to stdout and a tap parser.
    stdin.pipe(rProcess.stdout)
    stdin.pipe(new Parser(ontapdone))

    // Listen for writes, and reset clock if they happen.
    stdin.pipe(through(onwrite))

    // Set fake outputs, cannot set normally.
    Object.defineProperties(process, {
      stdout: {value: stdin},
      stderr: {value: rProcess.stderr}
    })

    console.log = log(process.stdout)
    console.error = log(process.stderr)
    debug.log = console.error

    // Listen for fatal errors, which we cannot in normal Node ways.
    window.addEventListener('error', onerror)

    // Timeout.
    timeout = process.env.TAP_TIMEOUT || 1000

    debug('Using timeout: ' + timeout)

    // Count current `exit` handlers used by Atom/Electron.
    exitCount = exits.length

    // This callback is invoked when there wasn’t any output by the tests for
    // `timeout` milliseconds.
    // So we end the tests by faking `process.exit()`, as TAP harnesses often
    // bind to that event.
    // We also set the real `process.exit` to a no-op, as that’s often also
    // invoked by harnesses.
    tick = delay(delayed, timeout)

    // Load all tests.
    index = -1
    while (++index < globs.length) {
      glob(globs[index], onglob)
    }

    function ontapdone(results) {
      resolve(results.ok ? 0 : 1)
    }

    function onerror() {
      // No need to log the error, chromium will do that already.
      resolve(1)
      return true
    }

    function onwrite(chunk, enc, callback) {
      tick()
      callback()
    }

    function delayed() {
      var originals = exits.slice(0, exitCount)
      var fn = process.exit

      evs.exit = exits.slice(exitCount)

      process.exit = noop
      process.emit('exit', 0)
      exits = originals
      evs.exit = originals
      process.exit = fn

      // Finally, end the stream, so the tape parser ends as well.
      stdin.end()
    }

    function onglob(error, files) {
      var index = -1

      if (error) {
        console.error(error.stack || error)
        resolve(1)
        return
      }

      while (++index < files.length) {
        tick()

        // Require each file.
        try {
          require(files[index])
        } catch (error) {
          console.error(error.stack || error)
          resolve(1)
        }
      }
    }
  }
}

// Fix `console.*` calls, they look horrible otherwise.
function log(stream) {
  return logger

  function logger() {
    stream.write(format.apply(null, arguments) + '\n')
  }
}

// Call `cb` after `timeout` ms of `tick` not being called.
function delay(cb, timeout) {
  var id

  return tick

  function tick() {
    clearTimeout(id)

    id = setTimeout(once, timeout)

    function once() {
      cb()
      cb = noop
    }
  }
}

function noop() {}
