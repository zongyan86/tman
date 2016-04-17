(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tman = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'
// **Github:** https://github.com/thunks/tman
//
// **License:** MIT

var thunk = require('thunks')()
var suite = require('./suite')

var tm = module.exports = tmanFactroy()
tm.NAME = 'tman'
tm.VERSION = '0.8.0'
tm.TEST = window.TEST
tm.Test = suite.Test
tm.Suite = suite.Suite
tm.createTman = tmanFactroy

function tmanFactroy () {
  var rootSuite = tman.rootSuite = new suite.Suite('root', null, '')
  rootSuite.no_timeout = false
  rootSuite.exit = true
  rootSuite.abort = false
  rootSuite.passed = 0
  rootSuite.ignored = 0
  rootSuite.errors = []

  function tman (fn) {
    if (!tm.TEST) return
    rootSuite.pushSuite('tman', fn, '')
    tman.tryRun(1000)
  }
  tman.only = function (fn) {
    if (!tm.TEST) return
    rootSuite.pushSuite('tman', fn, 'only')
    tman.tryRun(1000)
  }
  tman.skip = function (fn) {
    if (!tm.TEST) return
    rootSuite.pushSuite('tman', fn, 'skip')
    tman.tryRun(1000)
  }

  tman.describe = tman.suite = function (title, fn) {
    rootSuite.pushSuite(title, fn, '')
  }
  tman.suite.only = function (title, fn) {
    rootSuite.pushSuite(title, fn, 'only')
  }
  tman.suite.skip = function (title, fn) {
    rootSuite.pushSuite(title, fn, 'skip')
  }

  tman.it = tman.test = function (title, fn) {
    rootSuite.pushTest(title, fn, '')
  }
  tman.test.only = function (title, fn) {
    rootSuite.pushTest(title, fn, 'only')
  }
  tman.test.skip = function (title, fn) {
    rootSuite.pushTest(title, fn, 'skip')
  }

  tman.before = function (fn) {
    rootSuite.pushBefore(fn)
  }

  tman.after = function (fn) {
    rootSuite.pushAfter(fn)
  }

  tman.beforeEach = function (fn) {
    rootSuite.pushBeforeEach(fn)
  }

  tman.afterEach = function (fn) {
    rootSuite.pushAfterEach(fn)
  }

  var running = false
  var timer = null
  tman.tryRun = function (delay) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(function () {
      if (!running) tman.run()
    }, delay > 0 ? +delay : 1)
  }
  tman.run = function (callback) {
    /* istanbul ignore next */
    if (running) throw new Error('T-man is running!')

    running = true
    rootSuite.abort = false
    rootSuite.passed = 0
    rootSuite.ignored = 0
    rootSuite.errors = []
    // init for browser
    var tmanEl = document.getElementById('tman')
    if (!tmanEl) {
      tmanEl = createEl('div', 'tman')
      tmanEl.setAttribute('id', 'tman')
      document.body.appendChild(tmanEl)
    }
    tmanEl.appendChild(createEl('h2', 'tman-header', 'T-man'))
    rootSuite.el = tmanEl

    return thunk.delay.call(this)(function () {
      return rootSuite
    })(function (err) {
      if (err) throw err
      var result = rootSuite.toJSON()
      result.passed = rootSuite.passed
      result.ignored = rootSuite.ignored
      result.errors = rootSuite.errors.slice()

      return result
    })(callback || finished)
  }

  return tman
}

// default out stream
suite.Suite.prototype.log = function () {
  console.log.apply(console, arguments)
}

suite.Suite.prototype.el = null
suite.Test.prototype.el = null

// default suite reporter (start event)
suite.Suite.prototype.start = function () {
  if (!this.parent) return // root
  var title = '✢ ' + this.title

  this.el = createEl('div', 'tman-suite')
  this.titleEl = createEl('h3', '', indent(this.depth) + title)
  this.el.appendChild(this.titleEl)
  this.parent.el.appendChild(this.el)
}

// default test reporter (start event)
suite.Test.prototype.start = function () {
  this.el = createEl('div', 'tman-test', indent(this.depth) + this.title)
  this.parent.el.appendChild(this.el)
}

// default test reporter (finish event)
suite.Test.prototype.finish = function () {
  var message = ''
  var className = 'tman-test '
  if (this.state === null) {
    message += ' ‒'
    className += 'ignored'
  } else if (this.state === true) {
    message += ' ✓'
    className += 'success'
    var time = this.endTime - this.startTime
    if (time > 50) message += ' (' + time + 'ms)'
  } else {
    message += ' ✗ (' + this.state.order + ')'
    className += 'error'
  }
  this.el.setAttribute('class', className)
  if (message) {
    var el = createEl('span', 'more-info', message)
    this.el.appendChild(el)
  }
}

// default finished reporter
function finished (err, res) {
  if (err) {
    console.error(err)
    window.alert(err.toString())
  }

  var resultEl = createEl('div', 'tman-footer')
  this.rootSuite.el.appendChild(resultEl)

  var statEl = createEl('div', 'tman-statistics')
  statEl.appendChild(createEl('span', 'info', 'Test ' + (res.errors.length ? 'failed: ' : 'finished: ')))
  statEl.appendChild(createEl('span', res.passed && 'success', res.passed + ' passed;'))
  statEl.appendChild(createEl('span', res.errors.length && 'error', res.errors.length + ' failed;'))
  statEl.appendChild(createEl('span', res.errors && 'ignored', res.ignored + ' ignored.'))
  statEl.appendChild(createEl('span', 'info', '(' + (res.endTime - res.startTime) + 'ms)'))

  resultEl.appendChild(statEl)
  /* istanbul ignore next */
  res.errors.forEach(function (err) {
    var errEl = createEl('div', 'tman-error')
    errEl.appendChild(createEl('h4', 'error', err.order + ') ' + err.title + ':'))
    var message = err.stack ? err.stack : String(err)
    message = message.replace(/^/gm, '<br/>').replace(/ /g, '&nbsp;').slice(5)
    errEl.appendChild(createEl('p', 'error-stack', message))
    resultEl.appendChild(errEl)
  })
}

function indent (len) {
  var ch = '&nbsp;&nbsp;'
  var pad = ''

  while (len > 0) {
    if (len & 1) pad += ch
    if ((len >>= 1)) ch = ch + ch // avoid "standard" lint
  }
  return pad
}

function createEl (tag, className, content) {
  var el = document.createElement(tag)
  if (className) el.setAttribute('class', className)
  if (content) el.innerHTML = content
  return el
}

},{"./suite":2,"thunks":3}],2:[function(require,module,exports){
'use strict'
// **Github:** https://github.com/thunks/tman
//
// **License:** MIT

var path = require('path')
var thunk = require('thunks')()

exports.Suite = Suite
exports.Test = Test

function Suite (title, parent, mode) {
  this.title = title
  this.parent = parent
  this.root = this
  while (this.root.parent) this.root = this.root.parent

  this.mode = mode
  this.ctxMachine = this
  this.duration = 0
  this.startTime = 0
  this.endTime = 0
  this.before = null
  this.after = null
  this.beforeEach = null
  this.afterEach = null
  this.depth = parent ? (parent.depth + 1) : 0
  this.children = []
}

Suite.prototype.log = null
/* istanbul ignore next */
Suite.prototype.init = function () {}
/* istanbul ignore next */
Suite.prototype.start = function () {}
/* istanbul ignore next */
Suite.prototype.finish = function () {}
/* istanbul ignore next */
Suite.prototype.inspect = function () {
  return {
    title: this.title,
    parent: this.parent && '<Suite: ' + this.parent.title + '>',
    mode: this.mode,
    duration: this.getDuration(),
    startTime: this.startTime,
    endTime: this.endTime,
    before: this.before && '<Hook: ' + this.before.constructor.name + '>',
    after: this.after && '<Hook: ' + this.after.constructor.name + '>',
    beforeEach: this.beforeEach && '<Hook: ' + this.beforeEach.constructor.name + '>',
    afterEach: this.afterEach && '<Hook: ' + this.afterEach.constructor.name + '>',
    depth: this.depth,
    children: this.children.map(function (test) {
      return '<' + test.constructor.name + ': ' + test.title + '>'
    })
  }
}

Suite.prototype.toJSON = function () {
  return {
    title: this.title,
    mode: this.mode,
    depth: this.depth,
    startTime: this.startTime,
    endTime: this.endTime,
    children: this.children.map(function (test) { return test.toJSON() })
  }
}

Suite.prototype.pushSuite = function (title, fn, mode) {
  var ctx = this.ctxMachine
  assertStr(title, ctx)
  assertFn(fn, ctx)
  // stop reading if 'only' mode
  if (ctx.isOnlyMode()) return
  var suite = new Suite(title, ctx, mode)
  ctx.children.push(suite)
  this.ctxMachine = suite
  fn.call(suite)
  this.ctxMachine = ctx
  if (mode === 'only') suite.setOnlyMode()
}

Suite.prototype.pushTest = function (title, fn, mode) {
  var ctx = this.ctxMachine
  assertStr(title, ctx)
  assertFn(fn, ctx)
  // stop reading if 'only' mode
  if (ctx.isOnlyMode()) return
  var test = new Test(title, ctx, fn, mode)
  if (mode === 'only') {
    ctx.children.length = 0
    ctx.setOnlyMode()
  }
  ctx.children.push(test)
}

Suite.prototype.pushBefore = function (fn) {
  var ctx = this.ctxMachine
  assertFn(fn, ctx)
  assertHook('before', ctx)
  ctx.before = fn
}

Suite.prototype.pushAfter = function (fn) {
  var ctx = this.ctxMachine
  assertFn(fn, ctx)
  assertHook('after', ctx)
  ctx.after = fn
}

Suite.prototype.pushBeforeEach = function (fn) {
  var ctx = this.ctxMachine
  assertFn(fn, ctx)
  assertHook('beforeEach', ctx)
  ctx.beforeEach = fn
}

Suite.prototype.pushAfterEach = function (fn) {
  var ctx = this.ctxMachine
  assertFn(fn, ctx)
  assertHook('afterEach', ctx)
  ctx.afterEach = fn
}

Suite.prototype.isOnlyMode = function () {
  return this.root.mode === 'only'
}

// only one 'only' mode is allowed
// will stop reading the rest
Suite.prototype.setOnlyMode = function () {
  if (this.parent) {
    // pull all child suite or test
    this.parent.children.length = 0
    // push the 'only' mode suite or it's parent.
    this.parent.children.push(this)
    this.parent.setOnlyMode()
  } else {
    // the root suite must be marked as 'only'
    this.mode = 'only'
  }
}

Suite.prototype.timeout = function (duration) {
  this.duration = duration
}

Suite.prototype.getDuration = function () {
  if (this.duration) return this.duration
  if (this.parent) return this.parent.getDuration()
  return 2000
}

Suite.prototype.fullTitle = function () {
  return this.parent ? path.join(this.parent.fullTitle(), this.title) : path.sep
}

Suite.prototype.toThunk = function () {
  var ctx = this
  this.init()
  if (this.mode === 'skip') {
    return function (done) {
      ctx.start()
      thunk.seq(ctx.children.map(function (test) {
        test.mode = 'skip'
        return test.toThunk()
      }))(function () {
        ctx.finish()
      })(done)
    }
  }

  var tasks = []
  this.children.forEach(function (test) {
    if (ctx.beforeEach) tasks.push(thunkFn(ctx.beforeEach, ctx))
    tasks.push(test.toThunk())
    if (ctx.afterEach) tasks.push(thunkFn(ctx.afterEach, ctx))
  })

  if (this.before) tasks.unshift(thunkFn(this.before, this))
  if (this.after) tasks.push(thunkFn(this.after, this))
  tasks.unshift(function (done) {
    ctx.start()
    ctx.startTime = Date.now()
    done()
  })
  tasks.push(function (done) {
    ctx.endTime = Date.now()
    ctx.finish()
    done()
  })
  return thunk.seq(tasks)
}

function Test (title, parent, fn, mode) {
  this.title = title
  this.parent = parent
  this.root = parent
  while (this.root.parent) this.root = this.root.parent

  this.depth = parent.depth + 1
  this.mode = mode
  this.duration = 0
  this.startTime = 0
  this.endTime = 0
  this.timer = null
  this.state = null // skip: null, passed: true, failed: error
  this.fn = fn
}
/* istanbul ignore next */
Test.prototype.init = function () {}
/* istanbul ignore next */
Test.prototype.start = function () {}
/* istanbul ignore next */
Test.prototype.finish = function () {}
/* istanbul ignore next */
Test.prototype.inspect = function () {
  return {
    title: this.title,
    parent: this.parent && '<Suite: ' + this.parent.title + '>',
    depth: this.depth,
    mode: this.mode,
    duration: this.getDuration(),
    startTime: this.startTime,
    endTime: this.endTime,
    state: this.state,
    fn: this.fn && '<Test: ' + this.fn.constructor.name + '>'
  }
}

Test.prototype.toJSON = function () {
  return {
    title: this.title,
    mode: this.mode,
    depth: this.depth,
    startTime: this.startTime,
    endTime: this.endTime,
    state: this.state
  }
}

Test.prototype.timeout = function (duration) {
  this.duration = duration
}

Test.prototype.getDuration = function () {
  return this.duration ? this.duration : this.parent.getDuration()
}

Test.prototype.fullTitle = function () {
  return path.join(this.parent.fullTitle(), this.title)
}

Test.prototype.toThunk = function () {
  var ctx = this
  this.init()
  return function (done) {
    /* istanbul ignore next */
    if (ctx.root.abort) return done()
    ctx.start()

    if (ctx.mode === 'skip') {
      ctx.root.ignored++
      ctx.finish()
      return done()
    }

    ctx.startTime = Date.now()
    thunk.race([
      function (callback) {
        thunk.call(ctx, ctx.fn.length ? ctx.fn : ctx.fn())(callback)
      },
      function (callback) {
        thunk.delay()(function () {
          var duration = ctx.getDuration()
          if (ctx.root.no_timeout || ctx.endTime || !duration) return
          ctx.timer = setTimeout(function () {
            callback(new Error('timeout of ' + duration + 'ms exceeded.'))
          }, duration)
        })
      }
    ])(function (err) {
      clearTimeout(ctx.timer)
      if (err == null) {
        ctx.state = true
        ctx.root.passed++
      } else {
        ctx.state = err
        ctx.root.errors.push(err)
        err.order = ctx.root.errors.length
        err.title = ctx.fullTitle()
      }
      ctx.endTime = Date.now()
      ctx.finish()
    })(done)
  }
}

function assertHook (hook, ctx) {
  if (ctx[hook]) {
    throw new Error('"' + hook + '" hook exist in "' + ctx.fullTitle() + '"')
  }
}

function assertFn (fn, ctx) {
  if (typeof fn !== 'function') {
    throw new Error(String(fn) + ' is not function in "' + ctx.fullTitle() + '"')
  }
}

function assertStr (str, ctx) {
  if (!str || typeof str !== 'string') {
    throw new Error(String(str) + ' is invalid string in "' + ctx.fullTitle() + '"')
  }
}

function thunkFn (fn, ctx) {
  return function (done) {
    thunk.call(ctx, fn.length ? fn : fn.call(ctx))(done)
  }
}

},{"path":4,"thunks":3}],3:[function(require,module,exports){
(function (process){
// **Github:** https://github.com/thunks/thunks
//
// **License:** MIT

/* global module, define, setImmediate */
;(function (root, factory) {
  'use strict'
  /* istanbul ignore next */
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else if (typeof define === 'function' && define.amd) define([], factory)
  else root.thunks = factory()
}(typeof window === 'object' ? window : this, function () {
  'use strict'

  var undef = void 0
  var maxTickDepth = 100
  var toString = Object.prototype.toString
  var hasOwnProperty = Object.prototype.hasOwnProperty
  /* istanbul ignore next */
  var objectKeys = Object.keys || function (obj) {
    var keys = []
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) keys.push(key)
    }
    return keys
  }
  /* istanbul ignore next */
  var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]'
  }
  /* istanbul ignore next */
  var nextTick = (typeof process === 'object' && process.nextTick)
    ? process.nextTick : typeof setImmediate === 'function'
    ? setImmediate : function (fn) {
      setTimeout(fn, 0)
    }

  function thunks (options) {
    var scope = Domain.prototype.scope = new Scope(options)

    function Domain (ctx) {
      this.ctx = ctx
    }

    function thunk (thunkable) {
      return childThunk(new Link([null, thunkable], null), new Domain(this === thunk ? null : this))
    }

    thunk.all = function (obj) {
      if (arguments.length > 1) obj = slice(arguments)
      return thunk.call(this, objectToThunk(obj, true))
    }

    thunk.seq = function (array) {
      if (arguments.length !== 1 || !isArray(array)) array = slice(arguments)
      return thunk.call(this, sequenceToThunk(array))
    }

    thunk.race = function (array) {
      if (arguments.length > 1) array = slice(arguments)
      return thunk.call(this, function (done) {
        for (var i = 0, l = array.length; i < l; i++) thunk.call(this, array[i])(done)
      })
    }

    thunk.digest = function () {
      var args = slice(arguments)
      return thunk.call(this, function (callback) {
        return apply(null, callback, args)
      })
    }

    thunk.thunkify = function (fn) {
      var ctx = this === thunk ? null : this
      return function () {
        var args = slice(arguments)
        return thunk.call(ctx || this, function (callback) {
          args.push(callback)
          return apply(this, fn, args)
        })
      }
    }

    thunk.lift = function (fn) {
      var ctx = this === thunk ? null : this
      return function () {
        return thunk.call(ctx || this, objectToThunk(slice(arguments), false))(function (err, res) {
          if (err != null) throw err
          return apply(this, fn, res)
        })
      }
    }

    thunk.delay = function (delay) {
      return thunk.call(this, function (callback) {
        return delay > 0 ? setTimeout(callback, delay) : nextTick(callback)
      })
    }

    thunk.stop = function (message) {
      var sig = new SigStop(message)
      nextTick(function () {
        return scope.onstop && scope.onstop.call(null, sig)
      })
      throw sig
    }

    thunk.persist = function (thunkable) {
      var result
      var queue = []
      var ctx = this === thunk ? null : this

      thunk.call(ctx, thunkable)(function () {
        result = slice(arguments)
        while (queue.length) apply(null, queue.shift(), result)
      })

      return function (callback) {
        return thunk.call(ctx || this, function (done) {
          if (result) return apply(null, done, result)
          else queue.push(done)
        })(callback)
      }
    }

    return thunk
  }

  function Scope (options) {
    this.onerror = this.onstop = this.debug = null
    if (isFunction(options)) this.onerror = options
    else if (options) {
      if (isFunction(options.onerror)) this.onerror = options.onerror
      if (isFunction(options.onstop)) this.onstop = options.onstop
      if (isFunction(options.debug)) this.debug = options.debug
    }
  }

  function Link (result, callback) {
    this.next = null
    this.result = result
    this.callback = callback
  }

  function SigStop (message) {
    this.message = String(message == null ? 'process stopped' : message)
  }
  SigStop.prototype.status = 19
  SigStop.prototype.code = 'SIGSTOP'

  function childThunk (parent, domain) {
    parent.next = new Link(null, null)
    return function (callback) {
      return child(parent, domain, callback)
    }
  }

  function child (parent, domain, callback) {
    if (parent.callback) throw new Error('The thunk already filled')
    if (callback && !isFunction(callback)) throw new TypeError(String(callback) + ' is not a function')
    parent.callback = callback || noOp
    if (parent.result) continuation(parent, domain)
    return childThunk(parent.next, domain)
  }

  function continuation (parent, domain, tickDepth) {
    var scope = domain.scope
    var current = parent.next
    var result = parent.result
    return result[0] != null ? callback(result[0]) : runThunk(domain.ctx, result[1], callback)

    function callback (err) {
      if (parent.result === null) return
      parent.result = null
      if (scope.debug) apply(null, scope.debug, arguments)

      var args = [err]
      if (err != null) {
        pruneErrorStack(err)
        if (err instanceof SigStop) return
        if (scope.onerror) {
          if (scope.onerror.call(null, err) !== true) return
          // if onerror return true then continue
          args[0] = null
        }
      } else {
        args[0] = null
        // transform two or more results to a array of results
        if (arguments.length === 2) args.push(arguments[1])
        else if (arguments.length > 2) args.push(slice(arguments, 1))
      }

      current.result = tryRun(domain.ctx, parent.callback, args)

      if (current.callback) {
        tickDepth = tickDepth || maxTickDepth
        if (--tickDepth) return continuation(current, domain, tickDepth)
        return nextTick(function () {
          continuation(current, domain, 0)
        })
      }
      if (current.result[0] != null) {
        nextTick(function () {
          if (!current.result) return
          if (scope.onerror) return scope.onerror.call(null, current.result[0])
          /* istanbul ignore next */
          noOp(current.result[0])
        })
      }
    }
  }

  function runThunk (ctx, value, callback, thunkObj, noTryRun) {
    var thunk = toThunk(value, thunkObj)
    if (!isFunction(thunk)) return thunk === undef ? callback(null) : callback(null, thunk)
    if (isGeneratorFunction(thunk)) thunk = generatorToThunk(thunk.call(ctx))
    else if (thunk.length !== 1) return callback(new Error('Not thunk function: ' + thunk))
    if (noTryRun) return thunk.call(ctx, callback)
    var err = tryRun(ctx, thunk, [callback])[0]
    return err && callback(err)
  }

  function tryRun (ctx, fn, args) {
    var result = [null, null]
    try {
      result[1] = apply(ctx, fn, args)
    } catch (err) {
      result[0] = err
    }
    return result
  }

  function toThunk (obj, thunkObj) {
    if (!obj || isFunction(obj)) return obj
    if (isGenerator(obj)) return generatorToThunk(obj)
    if (isFunction(obj.toThunk)) return obj.toThunk()
    if (isFunction(obj.then)) return promiseToThunk(obj)
    if (thunkObj && (isArray(obj) || isObject(obj))) return objectToThunk(obj, thunkObj)
    return obj
  }

  function generatorToThunk (gen) {
    return function (callback) {
      var ctx = this
      var tickDepth = maxTickDepth
      return run()

      function run (err, res) {
        if (err instanceof SigStop) return callback(err)
        var ret = err == null ? gen.next(res) : gen.throw(err)
        if (ret.done) return runThunk(ctx, ret.value, callback)
        if (--tickDepth) return runThunk(ctx, ret.value, next, true)
        return nextTick(function () {
          tickDepth = maxTickDepth
          return runThunk(ctx, ret.value, next, true)
        })
      }

      function next (err, res) {
        try {
          return run(err, arguments.length > 2 ? slice(arguments, 1) : res)
        } catch (error) {
          return callback(error)
        }
      }
    }
  }

  function objectToThunk (obj, thunkObj) {
    return function (callback) {
      var result
      var i = 0
      var len = 0
      var pending = 1
      var ctx = this
      var finished = false

      if (isArray(obj)) {
        result = Array(obj.length)
        for (len = obj.length; i < len; i++) next(obj[i], i)
      } else if (isObject(obj)) {
        result = {}
        var keys = objectKeys(obj)
        for (len = keys.length; i < len; i++) next(obj[keys[i]], keys[i])
      } else throw new Error('Not array or object')
      return --pending || callback(null, result)

      function next (fn, index) {
        if (finished) return
        ++pending
        runThunk(ctx, fn, function (err, res) {
          if (finished) return
          if (err != null) {
            finished = true
            return callback(err)
          }
          result[index] = arguments.length > 2 ? slice(arguments, 1) : res
          return --pending || callback(null, result)
        }, thunkObj, true)
      }
    }
  }

  function sequenceToThunk (array) {
    return function (callback) {
      var i = 0
      var ctx = this
      var end = array.length - 1
      var tickDepth = maxTickDepth
      var result = Array(array.length)
      return end < 0 ? callback(null, result) : runThunk(ctx, array[0], next, true)

      function next (err, res) {
        if (err != null) return callback(err)
        result[i] = arguments.length > 2 ? slice(arguments, 1) : res
        if (++i > end) return callback(null, result)
        if (--tickDepth) return runThunk(ctx, array[i], next, true)
        nextTick(function () {
          tickDepth = maxTickDepth
          runThunk(ctx, array[i], next, true)
        })
      }
    }
  }

  function promiseToThunk (promise) {
    return function (callback) {
      return promise.then(function (res) {
        callback(null, res)
      }, callback)
    }
  }

  // fast slice for `arguments`.
  function slice (args, start) {
    var len = args.length
    start = start || 0
    if (start >= len) return []

    var ret = Array(len - start)
    while (len-- > start) ret[len - start] = args[len]
    return ret
  }

  function apply (ctx, fn, args) {
    if (args.length === 2) return fn.call(ctx, args[0], args[1])
    if (args.length === 1) return fn.call(ctx, args[0])
    return fn.apply(ctx, args)
  }

  function isObject (obj) {
    return obj && obj.constructor === Object
  }

  function isFunction (fn) {
    return typeof fn === 'function'
  }

  function isGenerator (obj) {
    return isFunction(obj.next) && isFunction(obj.throw)
  }

  function isGeneratorFunction (fn) {
    return fn.constructor.name === 'GeneratorFunction'
  }

  function noOp (error) {
    if (error == null) return
    /* istanbul ignore next */
    nextTick(function () {
      if (isFunction(thunks.onerror)) thunks.onerror(error)
      else throw error
    })
  }

  function pruneErrorStack (error) {
    if (thunks.pruneErrorStack && error.stack) {
      error.stack = error.stack
        .replace(/^\s*at.*thunks\.js.*$/gm, '')
        .replace(/\n+/g, '\n')
    }
    return error
  }

  thunks.NAME = 'thunks'
  thunks.VERSION = '4.1.6'
  thunks['default'] = thunks
  thunks.pruneErrorStack = true
  return thunks
}))

}).call(this,require('_process'))
},{"_process":5}],4:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":5}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});