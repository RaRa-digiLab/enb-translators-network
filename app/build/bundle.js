/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";
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



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "./node_modules/graphology-utils/is-graph.js":
/*!***************************************************!*\
  !*** ./node_modules/graphology-utils/is-graph.js ***!
  \***************************************************/
/***/ ((module) => {

/**
 * Graphology isGraph
 * ===================
 *
 * Very simple function aiming at ensuring the given variable is a
 * graphology instance.
 */

/**
 * Checking the value is a graphology instance.
 *
 * @param  {any}     value - Target value.
 * @return {boolean}
 */
module.exports = function isGraph(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.addUndirectedEdgeWithKey === 'function' &&
    typeof value.dropNode === 'function' &&
    typeof value.multi === 'boolean'
  );
};


/***/ }),

/***/ "./node_modules/graphology/dist/graphology.umd.min.js":
/*!************************************************************!*\
  !*** ./node_modules/graphology/dist/graphology.umd.min.js ***!
  \************************************************************/
/***/ (function(module) {

!function(t,e){ true?module.exports=e():0}(this,(function(){"use strict";function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}function e(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,r(t,e)}function n(t){return n=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},n(t)}function r(t,e){return r=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},r(t,e)}function i(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function o(t,e,n){return o=i()?Reflect.construct:function(t,e,n){var i=[null];i.push.apply(i,e);var o=new(Function.bind.apply(t,i));return n&&r(o,n.prototype),o},o.apply(null,arguments)}function a(t){var e="function"==typeof Map?new Map:void 0;return a=function(t){if(null===t||(i=t,-1===Function.toString.call(i).indexOf("[native code]")))return t;var i;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==e){if(e.has(t))return e.get(t);e.set(t,a)}function a(){return o(t,arguments,n(this).constructor)}return a.prototype=Object.create(t.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),r(a,t)},a(t)}function u(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}var c=function(){for(var t=arguments[0],e=1,n=arguments.length;e<n;e++)if(arguments[e])for(var r in arguments[e])t[r]=arguments[e][r];return t};function d(t,e,n,r){var i=t._nodes.get(e),o=null;return i?o="mixed"===r?i.out&&i.out[n]||i.undirected&&i.undirected[n]:"directed"===r?i.out&&i.out[n]:i.undirected&&i.undirected[n]:o}function s(e){return null!==e&&"object"===t(e)&&"function"==typeof e.addUndirectedEdgeWithKey&&"function"==typeof e.dropNode}function h(e){return"object"===t(e)&&null!==e&&e.constructor===Object}function f(t){var e;for(e in t)return!1;return!0}function p(t,e,n){Object.defineProperty(t,e,{enumerable:!1,configurable:!1,writable:!0,value:n})}function l(t,e,n){var r={enumerable:!0,configurable:!0};"function"==typeof n?r.get=n:(r.value=n,r.writable=!1),Object.defineProperty(t,e,r)}function g(t){return!!h(t)&&!(t.attributes&&!Array.isArray(t.attributes))}"function"==typeof Object.assign&&(c=Object.assign);var y,v={exports:{}},b="object"==typeof Reflect?Reflect:null,w=b&&"function"==typeof b.apply?b.apply:function(t,e,n){return Function.prototype.apply.call(t,e,n)};y=b&&"function"==typeof b.ownKeys?b.ownKeys:Object.getOwnPropertySymbols?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:function(t){return Object.getOwnPropertyNames(t)};var m=Number.isNaN||function(t){return t!=t};function _(){_.init.call(this)}v.exports=_,v.exports.once=function(t,e){return new Promise((function(n,r){function i(n){t.removeListener(e,o),r(n)}function o(){"function"==typeof t.removeListener&&t.removeListener("error",i),n([].slice.call(arguments))}U(t,e,o,{once:!0}),"error"!==e&&function(t,e,n){"function"==typeof t.on&&U(t,"error",e,n)}(t,i,{once:!0})}))},_.EventEmitter=_,_.prototype._events=void 0,_.prototype._eventsCount=0,_.prototype._maxListeners=void 0;var k=10;function G(t){if("function"!=typeof t)throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof t)}function x(t){return void 0===t._maxListeners?_.defaultMaxListeners:t._maxListeners}function E(t,e,n,r){var i,o,a,u;if(G(n),void 0===(o=t._events)?(o=t._events=Object.create(null),t._eventsCount=0):(void 0!==o.newListener&&(t.emit("newListener",e,n.listener?n.listener:n),o=t._events),a=o[e]),void 0===a)a=o[e]=n,++t._eventsCount;else if("function"==typeof a?a=o[e]=r?[n,a]:[a,n]:r?a.unshift(n):a.push(n),(i=x(t))>0&&a.length>i&&!a.warned){a.warned=!0;var c=new Error("Possible EventEmitter memory leak detected. "+a.length+" "+String(e)+" listeners added. Use emitter.setMaxListeners() to increase limit");c.name="MaxListenersExceededWarning",c.emitter=t,c.type=e,c.count=a.length,u=c,console&&console.warn&&console.warn(u)}return t}function S(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function A(t,e,n){var r={fired:!1,wrapFn:void 0,target:t,type:e,listener:n},i=S.bind(r);return i.listener=n,r.wrapFn=i,i}function L(t,e,n){var r=t._events;if(void 0===r)return[];var i=r[e];return void 0===i?[]:"function"==typeof i?n?[i.listener||i]:[i]:n?function(t){for(var e=new Array(t.length),n=0;n<e.length;++n)e[n]=t[n].listener||t[n];return e}(i):N(i,i.length)}function D(t){var e=this._events;if(void 0!==e){var n=e[t];if("function"==typeof n)return 1;if(void 0!==n)return n.length}return 0}function N(t,e){for(var n=new Array(e),r=0;r<e;++r)n[r]=t[r];return n}function U(t,e,n,r){if("function"==typeof t.on)r.once?t.once(e,n):t.on(e,n);else{if("function"!=typeof t.addEventListener)throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof t);t.addEventListener(e,(function i(o){r.once&&t.removeEventListener(e,i),n(o)}))}}function j(t){if("function"!=typeof t)throw new Error("obliterator/iterator: expecting a function!");this.next=t}Object.defineProperty(_,"defaultMaxListeners",{enumerable:!0,get:function(){return k},set:function(t){if("number"!=typeof t||t<0||m(t))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+t+".");k=t}}),_.init=function(){void 0!==this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},_.prototype.setMaxListeners=function(t){if("number"!=typeof t||t<0||m(t))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+t+".");return this._maxListeners=t,this},_.prototype.getMaxListeners=function(){return x(this)},_.prototype.emit=function(t){for(var e=[],n=1;n<arguments.length;n++)e.push(arguments[n]);var r="error"===t,i=this._events;if(void 0!==i)r=r&&void 0===i.error;else if(!r)return!1;if(r){var o;if(e.length>0&&(o=e[0]),o instanceof Error)throw o;var a=new Error("Unhandled error."+(o?" ("+o.message+")":""));throw a.context=o,a}var u=i[t];if(void 0===u)return!1;if("function"==typeof u)w(u,this,e);else{var c=u.length,d=N(u,c);for(n=0;n<c;++n)w(d[n],this,e)}return!0},_.prototype.addListener=function(t,e){return E(this,t,e,!1)},_.prototype.on=_.prototype.addListener,_.prototype.prependListener=function(t,e){return E(this,t,e,!0)},_.prototype.once=function(t,e){return G(e),this.on(t,A(this,t,e)),this},_.prototype.prependOnceListener=function(t,e){return G(e),this.prependListener(t,A(this,t,e)),this},_.prototype.removeListener=function(t,e){var n,r,i,o,a;if(G(e),void 0===(r=this._events))return this;if(void 0===(n=r[t]))return this;if(n===e||n.listener===e)0==--this._eventsCount?this._events=Object.create(null):(delete r[t],r.removeListener&&this.emit("removeListener",t,n.listener||e));else if("function"!=typeof n){for(i=-1,o=n.length-1;o>=0;o--)if(n[o]===e||n[o].listener===e){a=n[o].listener,i=o;break}if(i<0)return this;0===i?n.shift():function(t,e){for(;e+1<t.length;e++)t[e]=t[e+1];t.pop()}(n,i),1===n.length&&(r[t]=n[0]),void 0!==r.removeListener&&this.emit("removeListener",t,a||e)}return this},_.prototype.off=_.prototype.removeListener,_.prototype.removeAllListeners=function(t){var e,n,r;if(void 0===(n=this._events))return this;if(void 0===n.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==n[t]&&(0==--this._eventsCount?this._events=Object.create(null):delete n[t]),this;if(0===arguments.length){var i,o=Object.keys(n);for(r=0;r<o.length;++r)"removeListener"!==(i=o[r])&&this.removeAllListeners(i);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if("function"==typeof(e=n[t]))this.removeListener(t,e);else if(void 0!==e)for(r=e.length-1;r>=0;r--)this.removeListener(t,e[r]);return this},_.prototype.listeners=function(t){return L(this,t,!0)},_.prototype.rawListeners=function(t){return L(this,t,!1)},_.listenerCount=function(t,e){return"function"==typeof t.listenerCount?t.listenerCount(e):D.call(t,e)},_.prototype.listenerCount=D,_.prototype.eventNames=function(){return this._eventsCount>0?y(this._events):[]},"undefined"!=typeof Symbol&&(j.prototype[Symbol.iterator]=function(){return this}),j.of=function(){var t=arguments,e=t.length,n=0;return new j((function(){return n>=e?{done:!0}:{done:!1,value:t[n++]}}))},j.empty=function(){return new j((function(){return{done:!0}}))},j.fromSequence=function(t){var e=0,n=t.length;return new j((function(){return e>=n?{done:!0}:{done:!1,value:t[e++]}}))},j.is=function(t){return t instanceof j||"object"==typeof t&&null!==t&&"function"==typeof t.next};var O=j,C={};C.ARRAY_BUFFER_SUPPORT="undefined"!=typeof ArrayBuffer,C.SYMBOL_SUPPORT="undefined"!=typeof Symbol;var z=O,M=C,P=M.ARRAY_BUFFER_SUPPORT,T=M.SYMBOL_SUPPORT;var R=function(t){var e=function(t){return"string"==typeof t||Array.isArray(t)||P&&ArrayBuffer.isView(t)?z.fromSequence(t):"object"!=typeof t||null===t?null:T&&"function"==typeof t[Symbol.iterator]?t[Symbol.iterator]():"function"==typeof t.next?t:null}(t);if(!e)throw new Error("obliterator: target is not iterable nor a valid iterator.");return e},W=R,K=function(t,e){for(var n,r=arguments.length>1?e:1/0,i=r!==1/0?new Array(r):[],o=0,a=W(t);;){if(o===r)return i;if((n=a.next()).done)return o!==e&&(i.length=o),i;i[o++]=n.value}},I=function(t){function n(e){var n;return(n=t.call(this)||this).name="GraphError",n.message=e,n}return e(n,t),n}(a(Error)),F=function(t){function n(e){var r;return(r=t.call(this,e)||this).name="InvalidArgumentsGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(u(r),n.prototype.constructor),r}return e(n,t),n}(I),Y=function(t){function n(e){var r;return(r=t.call(this,e)||this).name="NotFoundGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(u(r),n.prototype.constructor),r}return e(n,t),n}(I),B=function(t){function n(e){var r;return(r=t.call(this,e)||this).name="UsageGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(u(r),n.prototype.constructor),r}return e(n,t),n}(I);function q(t,e){this.key=t,this.attributes=e,this.clear()}function J(t,e){this.key=t,this.attributes=e,this.clear()}function V(t,e){this.key=t,this.attributes=e,this.clear()}function H(t,e,n,r,i){this.key=e,this.attributes=i,this.undirected=t,this.source=n,this.target=r}function Q(t,e,n,r,i,o,a){var u,c,d="out",s="in";if(e&&(d=s="undirected"),t.multi){if(void 0===(c=(u=o[d])[i])&&(c=new Set,u[i]=c),c.add(n),r===i&&e)return;void 0===(u=a[s])[r]&&(u[r]=c)}else{if(o[d][i]=n,r===i&&e)return;a[s][r]=n}}function X(t,e,n){var r=t.multi,i=n.source,o=n.target,a=i.key,u=o.key,c=i[e?"undirected":"out"],d=e?"undirected":"in";if(u in c)if(r){var s=c[u];1===s.size?(delete c[u],delete o[d][a]):s.delete(n)}else delete c[u];r||delete o[d][a]}q.prototype.clear=function(){this.inDegree=0,this.outDegree=0,this.undirectedDegree=0,this.directedSelfLoops=0,this.undirectedSelfLoops=0,this.in={},this.out={},this.undirected={}},J.prototype.clear=function(){this.inDegree=0,this.outDegree=0,this.directedSelfLoops=0,this.in={},this.out={}},J.prototype.upgradeToMixed=function(){this.undirectedDegree=0,this.undirectedSelfLoops=0,this.undirected={}},V.prototype.clear=function(){this.undirectedDegree=0,this.undirectedSelfLoops=0,this.undirected={}},V.prototype.upgradeToMixed=function(){this.inDegree=0,this.outDegree=0,this.directedSelfLoops=0,this.in={},this.out={}};function Z(t,e,n,r,i,o,a){var u,c,d,s;if(r=""+r,0===n){if(!(u=t._nodes.get(r)))throw new Y("Graph.".concat(e,': could not find the "').concat(r,'" node in the graph.'));d=i,s=o}else if(3===n){if(i=""+i,!(c=t._edges.get(i)))throw new Y("Graph.".concat(e,': could not find the "').concat(i,'" edge in the graph.'));var h=c.source.key,f=c.target.key;if(r===h)u=c.target;else{if(r!==f)throw new Y("Graph.".concat(e,': the "').concat(r,'" node is not attached to the "').concat(i,'" edge (').concat(h,", ").concat(f,")."));u=c.source}d=o,s=a}else{if(!(c=t._edges.get(r)))throw new Y("Graph.".concat(e,': could not find the "').concat(r,'" edge in the graph.'));u=1===n?c.source:c.target,d=i,s=o}return[u,d,s]}var $=[{name:function(t){return"get".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];return a.attributes[u]}}},{name:function(t){return"get".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r){return Z(this,e,n,t,r)[0].attributes}}},{name:function(t){return"has".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];return a.attributes.hasOwnProperty(u)}}},{name:function(t){return"set".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i,o){var a=Z(this,e,n,t,r,i,o),u=a[0],c=a[1],d=a[2];return u.attributes[c]=d,this.emit("nodeAttributesUpdated",{key:u.key,type:"set",attributes:u.attributes,name:c}),this}}},{name:function(t){return"update".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i,o){var a=Z(this,e,n,t,r,i,o),u=a[0],c=a[1],d=a[2];if("function"!=typeof d)throw new F("Graph.".concat(e,": updater should be a function."));var s=u.attributes,h=d(s[c]);return s[c]=h,this.emit("nodeAttributesUpdated",{key:u.key,type:"set",attributes:u.attributes,name:c}),this}}},{name:function(t){return"remove".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];return delete a.attributes[u],this.emit("nodeAttributesUpdated",{key:a.key,type:"remove",attributes:a.attributes,name:u}),this}}},{name:function(t){return"replace".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];if(!h(u))throw new F("Graph.".concat(e,": provided attributes are not a plain object."));return a.attributes=u,this.emit("nodeAttributesUpdated",{key:a.key,type:"replace",attributes:a.attributes}),this}}},{name:function(t){return"merge".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];if(!h(u))throw new F("Graph.".concat(e,": provided attributes are not a plain object."));return c(a.attributes,u),this.emit("nodeAttributesUpdated",{key:a.key,type:"merge",attributes:a.attributes,data:u}),this}}},{name:function(t){return"update".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o=Z(this,e,n,t,r,i),a=o[0],u=o[1];if("function"!=typeof u)throw new F("Graph.".concat(e,": provided updater is not a function."));return a.attributes=u(a.attributes),this.emit("nodeAttributesUpdated",{key:a.key,type:"update",attributes:a.attributes}),this}}}];var tt=[{name:function(t){return"get".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return i.attributes[r]}}},{name:function(t){return"get".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t){var r;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>1){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var i=""+t,o=""+arguments[1];if(!(r=d(this,i,o,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(i,'" - "').concat(o,'").'))}else if(t=""+t,!(r=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("mixed"!==n&&r.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return r.attributes}}},{name:function(t){return"has".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return i.attributes.hasOwnProperty(r)}}},{name:function(t){return"set".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>3){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+t,u=""+r;if(r=arguments[2],i=arguments[3],!(o=d(this,a,u,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(a,'" - "').concat(u,'").'))}else if(t=""+t,!(o=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("mixed"!==n&&o.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return o.attributes[r]=i,this.emit("edgeAttributesUpdated",{key:o.key,type:"set",attributes:o.attributes,name:r}),this}}},{name:function(t){return"update".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>3){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+t,u=""+r;if(r=arguments[2],i=arguments[3],!(o=d(this,a,u,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(a,'" - "').concat(u,'").'))}else if(t=""+t,!(o=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("function"!=typeof i)throw new F("Graph.".concat(e,": updater should be a function."));if("mixed"!==n&&o.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return o.attributes[r]=i(o.attributes[r]),this.emit("edgeAttributesUpdated",{key:o.key,type:"set",attributes:o.attributes,name:r}),this}}},{name:function(t){return"remove".concat(t,"Attribute")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return delete i.attributes[r],this.emit("edgeAttributesUpdated",{key:i.key,type:"remove",attributes:i.attributes,name:r}),this}}},{name:function(t){return"replace".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if(!h(r))throw new F("Graph.".concat(e,": provided attributes are not a plain object."));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return i.attributes=r,this.emit("edgeAttributesUpdated",{key:i.key,type:"replace",attributes:i.attributes}),this}}},{name:function(t){return"merge".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if(!h(r))throw new F("Graph.".concat(e,": provided attributes are not a plain object."));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return c(i.attributes,r),this.emit("edgeAttributesUpdated",{key:i.key,type:"merge",attributes:i.attributes,data:r}),this}}},{name:function(t){return"update".concat(t,"Attributes")},attacher:function(t,e,n){t.prototype[e]=function(t,r){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new B("Graph.".concat(e,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new B("Graph.".concat(e,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+t,a=""+r;if(r=arguments[2],!(i=d(this,o,a,n)))throw new Y("Graph.".concat(e,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(t=""+t,!(i=this._edges.get(t)))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" edge in the graph.'));if("function"!=typeof r)throw new F("Graph.".concat(e,": provided updater is not a function."));if("mixed"!==n&&i.undirected!==("undirected"===n))throw new Y("Graph.".concat(e,': could not find the "').concat(t,'" ').concat(n," edge in the graph."));return i.attributes=r(i.attributes),this.emit("edgeAttributesUpdated",{key:i.key,type:"update",attributes:i.attributes}),this}}}];var et=O,nt=R,rt=function(){var t=arguments,e=null,n=-1;return new et((function r(){if(null===e){if(++n>=t.length)return{done:!0};e=nt(t[n])}var i=e.next();return i.done?(e=null,r()):i}))},it=[{name:"edges",type:"mixed"},{name:"inEdges",type:"directed",direction:"in"},{name:"outEdges",type:"directed",direction:"out"},{name:"inboundEdges",type:"mixed",direction:"in"},{name:"outboundEdges",type:"mixed",direction:"out"},{name:"directedEdges",type:"directed"},{name:"undirectedEdges",type:"undirected"}];function ot(t,e){for(var n in e)t.push(e[n].key)}function at(t,e){for(var n in e)e[n].forEach((function(e){return t.push(e.key)}))}function ut(t,e,n){for(var r in t)if(r!==n){var i=t[r];e(i.key,i.attributes,i.source.key,i.target.key,i.source.attributes,i.target.attributes,i.undirected)}}function ct(t,e,n){for(var r in t)r!==n&&t[r].forEach((function(t){return e(t.key,t.attributes,t.source.key,t.target.key,t.source.attributes,t.target.attributes,t.undirected)}))}function dt(t,e,n){for(var r in t)if(r!==n){var i=t[r];if(e(i.key,i.attributes,i.source.key,i.target.key,i.source.attributes,i.target.attributes,i.undirected))return i.key}}function st(t,e,n){var r,i,o,a,u;for(var c in t)if(c!==n)for(r=t[c].values();!0!==(i=r.next()).done;)if(a=(o=i.value).source,u=o.target,e(o.key,o.attributes,a.key,u.key,a.attributes,u.attributes,o.undirected))return o.key}function ht(t,e){var n=Object.keys(t),r=n.length,i=null,o=0;return new O((function a(){var u;if(i){var c=i.next();if(c.done)return i=null,o++,a();u=c.value}else{if(o>=r)return{done:!0};var d=n[o];if(d===e)return o++,a();if((u=t[d])instanceof Set)return i=u.values(),a();o++}return{done:!1,value:{edge:u.key,attributes:u.attributes,source:u.source.key,target:u.target.key,sourceAttributes:u.source.attributes,targetAttributes:u.target.attributes,undirected:u.undirected}}}))}function ft(t,e,n){var r=e[n];r&&t.push(r.key)}function pt(t,e,n){var r=e[n];r&&r.forEach((function(e){return t.push(e.key)}))}function lt(t,e,n){var r=t[e];if(r){var i=r.source,o=r.target;n(r.key,r.attributes,i.key,o.key,i.attributes,o.attributes,r.undirected)}}function gt(t,e,n){var r=t[e];r&&r.forEach((function(t){return n(t.key,t.attributes,t.source.key,t.target.key,t.source.attributes,t.target.attributes,t.undirected)}))}function yt(t,e,n){var r=t[e];if(r){var i=r.source,o=r.target;return n(r.key,r.attributes,i.key,o.key,i.attributes,o.attributes,r.undirected)?r.key:void 0}}function vt(t,e,n){var r=t[e];if(r)for(var i,o,a=r.values();!0!==(i=a.next()).done;)if(n((o=i.value).key,o.attributes,o.source.key,o.target.key,o.source.attributes,o.target.attributes,o.undirected))return o.key}function bt(t,e){var n=t[e];if(n instanceof Set){var r=n.values();return new O((function(){var t=r.next();if(t.done)return t;var e=t.value;return{done:!1,value:{edge:e.key,attributes:e.attributes,source:e.source.key,target:e.target.key,sourceAttributes:e.source.attributes,targetAttributes:e.target.attributes,undirected:e.undirected}}}))}return O.of([n.key,n.attributes,n.source.key,n.target.key,n.source.attributes,n.target.attributes])}function wt(t,e){if(0===t.size)return[];if("mixed"===e||e===t.type)return"function"==typeof Array.from?Array.from(t._edges.keys()):K(t._edges.keys(),t._edges.size);for(var n,r,i="undirected"===e?t.undirectedSize:t.directedSize,o=new Array(i),a="undirected"===e,u=t._edges.values(),c=0;!0!==(n=u.next()).done;)(r=n.value).undirected===a&&(o[c++]=r.key);return o}function mt(t,e,n){if(0!==t.size)for(var r,i,o="mixed"!==e&&e!==t.type,a="undirected"===e,u=t._edges.values();!0!==(r=u.next()).done;)if(i=r.value,!o||i.undirected===a){var c=i,d=c.key,s=c.attributes,h=c.source,f=c.target;n(d,s,h.key,f.key,h.attributes,f.attributes,i.undirected)}}function _t(t,e,n){if(0!==t.size)for(var r,i,o="mixed"!==e&&e!==t.type,a="undirected"===e,u=t._edges.values();!0!==(r=u.next()).done;)if(i=r.value,!o||i.undirected===a){var c=i,d=c.key,s=c.attributes,h=c.source,f=c.target;if(n(d,s,h.key,f.key,h.attributes,f.attributes,i.undirected))return d}}function kt(t,e){if(0===t.size)return O.empty();var n="mixed"!==e&&e!==t.type,r="undirected"===e,i=t._edges.values();return new O((function(){for(var t,e;;){if((t=i.next()).done)return t;if(e=t.value,!n||e.undirected===r)break}return{value:{edge:e.key,attributes:e.attributes,source:e.source.key,target:e.target.key,sourceAttributes:e.source.attributes,targetAttributes:e.target.attributes,undirected:e.undirected},done:!1}}))}function Gt(t,e,n,r){var i=[],o=t?at:ot;return"undirected"!==e&&("out"!==n&&o(i,r.in),"in"!==n&&o(i,r.out),!n&&r.directedSelfLoops>0&&i.splice(i.lastIndexOf(r.key),1)),"directed"!==e&&o(i,r.undirected),i}function xt(t,e,n,r,i){var o=t?ct:ut;"undirected"!==e&&("out"!==n&&o(r.in,i),"in"!==n&&o(r.out,i,n?null:r.key)),"directed"!==e&&o(r.undirected,i)}function Et(t,e,n,r,i){var o,a=t?st:dt;if("undirected"!==e){if("out"!==n&&(o=a(r.in,i)))return o;if("in"!==n&&(o=a(r.out,i,n?null:r.key)))return o}if("directed"!==e&&(o=a(r.undirected,i)))return o}function St(t,e,n){var r=O.empty();return"undirected"!==t&&("out"!==e&&void 0!==n.in&&(r=rt(r,ht(n.in))),"in"!==e&&void 0!==n.out&&(r=rt(r,ht(n.out,e?null:n.key)))),"directed"!==t&&void 0!==n.undirected&&(r=rt(r,ht(n.undirected))),r}function At(t,e,n,r,i){var o=e?pt:ft,a=[];return"undirected"!==t&&(void 0!==r.in&&"out"!==n&&o(a,r.in,i),void 0!==r.out&&"in"!==n&&o(a,r.out,i),!n&&r.directedSelfLoops>0&&a.splice(a.lastIndexOf(r.key),1)),"directed"!==t&&void 0!==r.undirected&&o(a,r.undirected,i),a}function Lt(t,e,n,r,i,o){var a=e?gt:lt;"undirected"!==t&&(void 0!==r.in&&"out"!==n&&a(r.in,i,o),r.key!==i&&void 0!==r.out&&"in"!==n&&a(r.out,i,o)),"directed"!==t&&void 0!==r.undirected&&a(r.undirected,i,o)}function Dt(t,e,n,r,i,o){var a,u=e?vt:yt;if("undirected"!==t){if(void 0!==r.in&&"out"!==n&&(a=u(r.in,i,o)))return a;if(r.key!==i&&void 0!==r.out&&"in"!==n&&(a=u(r.out,i,o,n?null:r.key)))return a}if("directed"!==t&&void 0!==r.undirected&&(a=u(r.undirected,i,o)))return a}function Nt(t,e,n,r){var i=O.empty();return"undirected"!==t&&(void 0!==n.in&&"out"!==e&&r in n.in&&(i=rt(i,bt(n.in,r))),void 0!==n.out&&"in"!==e&&r in n.out&&(i=rt(i,bt(n.out,r)))),"directed"!==t&&void 0!==n.undirected&&r in n.undirected&&(i=rt(i,bt(n.undirected,r))),i}var Ut=[{name:"neighbors",type:"mixed"},{name:"inNeighbors",type:"directed",direction:"in"},{name:"outNeighbors",type:"directed",direction:"out"},{name:"inboundNeighbors",type:"mixed",direction:"in"},{name:"outboundNeighbors",type:"mixed",direction:"out"},{name:"directedNeighbors",type:"directed"},{name:"undirectedNeighbors",type:"undirected"}];function jt(t,e){if(void 0!==e)for(var n in e)t.add(n)}function Ot(t,e,n){for(var r in e){var i=e[r];i instanceof Set&&(i=i.values().next().value);var o=i.source,a=i.target,u=o===t?a:o;n(u.key,u.attributes)}}function Ct(t,e,n,r){for(var i in n){var o=n[i];o instanceof Set&&(o=o.values().next().value);var a=o.source,u=o.target,c=a===e?u:a;t.has(c.key)||(t.add(c.key),r(c.key,c.attributes))}}function zt(t,e,n){for(var r in e){var i=e[r];i instanceof Set&&(i=i.values().next().value);var o=i.source,a=i.target,u=o===t?a:o;if(n(u.key,u.attributes))return u.key}}function Mt(t,e,n,r){for(var i in n){var o=n[i];o instanceof Set&&(o=o.values().next().value);var a=o.source,u=o.target,c=a===e?u:a;if(!t.has(c.key))if(t.add(c.key),r(c.key,c.attributes))return c.key}}function Pt(t,e){var n=Object.keys(e),r=n.length,i=0;return new O((function(){if(i>=r)return{done:!0};var o=e[n[i++]];o instanceof Set&&(o=o.values().next().value);var a=o.source,u=o.target,c=a===t?u:a;return{done:!1,value:{neighbor:c.key,attributes:c.attributes}}}))}function Tt(t,e,n){var r=Object.keys(n),i=r.length,o=0;return new O((function a(){if(o>=i)return{done:!0};var u=n[r[o++]];u instanceof Set&&(u=u.values().next().value);var c=u.source,d=u.target,s=c===e?d:c;return t.has(s.key)?a():(t.add(s.key),{done:!1,value:{neighbor:s.key,attributes:s.attributes}})}))}function Rt(t,e){var n=e.name,r=e.type,i=e.direction;t.prototype[n]=function(t){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return[];t=""+t;var e=this._nodes.get(t);if(void 0===e)throw new Y("Graph.".concat(n,': could not find the "').concat(t,'" node in the graph.'));return function(t,e,n){if("mixed"!==t){if("undirected"===t)return Object.keys(n.undirected);if("string"==typeof e)return Object.keys(n[e])}var r=new Set;return"undirected"!==t&&("out"!==e&&jt(r,n.in),"in"!==e&&jt(r,n.out)),"directed"!==t&&jt(r,n.undirected),K(r.values(),r.size)}("mixed"===r?this.type:r,i,e)}}function Wt(t,e){var n=e.name,r=e.type,i=e.direction,o="forEach"+n[0].toUpperCase()+n.slice(1,-1);t.prototype[o]=function(t,e){if("mixed"===r||"mixed"===this.type||r===this.type){t=""+t;var n=this._nodes.get(t);if(void 0===n)throw new Y("Graph.".concat(o,': could not find the "').concat(t,'" node in the graph.'));!function(t,e,n,r){if("mixed"!==t){if("undirected"===t)return Ot(n,n.undirected,r);if("string"==typeof e)return Ot(n,n[e],r)}var i=new Set;"undirected"!==t&&("out"!==e&&Ct(i,n,n.in,r),"in"!==e&&Ct(i,n,n.out,r)),"directed"!==t&&Ct(i,n,n.undirected,r)}("mixed"===r?this.type:r,i,n,e)}};var a="map"+n[0].toUpperCase()+n.slice(1);t.prototype[a]=function(t,e){var n=[];return this[o](t,(function(t,r){n.push(e(t,r))})),n};var u="filter"+n[0].toUpperCase()+n.slice(1);t.prototype[u]=function(t,e){var n=[];return this[o](t,(function(t,r){e(t,r)&&n.push(t)})),n};var c="reduce"+n[0].toUpperCase()+n.slice(1);t.prototype[c]=function(t,e,n){if(arguments.length<3)throw new F("Graph.".concat(c,": missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array."));var r=n;return this[o](t,(function(t,n){r=e(r,t,n)})),r}}function Kt(t,e){var n=e.name,r=e.type,i=e.direction,o=n[0].toUpperCase()+n.slice(1,-1),a="find"+o;t.prototype[a]=function(t,e){if("mixed"===r||"mixed"===this.type||r===this.type){t=""+t;var n=this._nodes.get(t);if(void 0===n)throw new Y("Graph.".concat(a,': could not find the "').concat(t,'" node in the graph.'));return function(t,e,n,r){if("mixed"!==t){if("undirected"===t)return zt(n,n.undirected,r);if("string"==typeof e)return zt(n,n[e],r)}var i,o=new Set;if("undirected"!==t){if("out"!==e&&(i=Mt(o,n,n.in,r)))return i;if("in"!==e&&(i=Mt(o,n,n.out,r)))return i}if("directed"!==t&&(i=Mt(o,n,n.undirected,r)))return i}("mixed"===r?this.type:r,i,n,e)}};var u="some"+o;t.prototype[u]=function(t,e){return!!this[a](t,e)};var c="every"+o;t.prototype[c]=function(t,e){return!this[a](t,(function(t,n){return!e(t,n)}))}}function It(t,e){var n=e.name,r=e.type,i=e.direction,o=n.slice(0,-1)+"Entries";t.prototype[o]=function(t){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return O.empty();t=""+t;var e=this._nodes.get(t);if(void 0===e)throw new Y("Graph.".concat(o,': could not find the "').concat(t,'" node in the graph.'));return function(t,e,n){if("mixed"!==t){if("undirected"===t)return Pt(n,n.undirected);if("string"==typeof e)return Pt(n,n[e])}var r=O.empty(),i=new Set;return"undirected"!==t&&("out"!==e&&(r=rt(r,Tt(i,n,n.in))),"in"!==e&&(r=rt(r,Tt(i,n,n.out)))),"directed"!==t&&(r=rt(r,Tt(i,n,n.undirected))),r}("mixed"===r?this.type:r,i,e)}}function Ft(t,e,n,r,i){for(var o,a,u,c,d,s,h,f=r._nodes.values(),p=r.type;!0!==(o=f.next()).done;){var l=!1;if(a=o.value,"undirected"!==p)for(u in c=a.out)if(s=(d=c[u]).target,l=!0,h=i(a.key,s.key,a.attributes,s.attributes,d.key,d.attributes,d.undirected),t&&h)return d;if("directed"!==p)for(u in c=a.undirected)if(!(e&&a.key>u)&&((s=(d=c[u]).target).key!==u&&(s=d.source),l=!0,h=i(a.key,s.key,a.attributes,s.attributes,d.key,d.attributes,d.undirected),t&&h))return d;if(n&&!l&&(h=i(a.key,null,a.attributes,null,null,null,null),t&&h))return null}}function Yt(t,e,n,r,i){for(var o,a,u,c,d,s,h,f,p,l=r._nodes.values(),g=r.type;!0!==(o=l.next()).done;){var y=!1;if(a=o.value,"undirected"!==g)for(u in s=a.out)for(c=s[u].values();!0!==(d=c.next()).done;)if(f=(h=d.value).target,y=!0,p=i(a.key,f.key,a.attributes,f.attributes,h.key,h.attributes,h.undirected),t&&p)return h;if("directed"!==g)for(u in s=a.undirected)if(!(e&&a.key>u))for(c=s[u].values();!0!==(d=c.next()).done;)if((f=(h=d.value).target).key!==u&&(f=h.source),y=!0,p=i(a.key,f.key,a.attributes,f.attributes,h.key,h.attributes,h.undirected),t&&p)return h;if(n&&!y&&(p=i(a.key,null,a.attributes,null,null,null,null),t&&p))return null}}function Bt(t,e){var n={key:t};return f(e.attributes)||(n.attributes=c({},e.attributes)),n}function qt(t,e){var n={key:t,source:e.source.key,target:e.target.key};return f(e.attributes)||(n.attributes=c({},e.attributes)),e.undirected&&(n.undirected=!0),n}function Jt(t){return h(t)?"key"in t?!("attributes"in t)||h(t.attributes)&&null!==t.attributes?null:"invalid-attributes":"no-key":"not-object"}function Vt(t){return h(t)?"source"in t?"target"in t?!("attributes"in t)||h(t.attributes)&&null!==t.attributes?"undirected"in t&&"boolean"!=typeof t.undirected?"invalid-undirected":null:"invalid-attributes":"no-target":"no-source":"not-object"}var Ht,Qt=(Ht=255&Math.floor(256*Math.random()),function(){return Ht++}),Xt=new Set(["directed","undirected","mixed"]),Zt=new Set(["domain","_events","_eventsCount","_maxListeners"]),$t={allowSelfLoops:!0,multi:!1,type:"mixed"};function te(t,e,n){var r=new t.NodeDataClass(e,n);return t._nodes.set(e,r),t.emit("nodeAdded",{key:e,attributes:n}),r}function ee(t,e,n,r,i,o,a,u){if(!r&&"undirected"===t.type)throw new B("Graph.".concat(e,": you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead."));if(r&&"directed"===t.type)throw new B("Graph.".concat(e,": you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead."));if(u&&!h(u))throw new F("Graph.".concat(e,': invalid attributes. Expecting an object but got "').concat(u,'"'));if(o=""+o,a=""+a,u=u||{},!t.allowSelfLoops&&o===a)throw new B("Graph.".concat(e,': source & target are the same ("').concat(o,"\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."));var c=t._nodes.get(o),d=t._nodes.get(a);if(!c)throw new Y("Graph.".concat(e,': source node "').concat(o,'" not found.'));if(!d)throw new Y("Graph.".concat(e,': target node "').concat(a,'" not found.'));var s={key:null,undirected:r,source:o,target:a,attributes:u};if(n)i=t._edgeKeyGenerator();else if(i=""+i,t._edges.has(i))throw new B("Graph.".concat(e,': the "').concat(i,'" edge already exists in the graph.'));if(!t.multi&&(r?void 0!==c.undirected[a]:void 0!==c.out[a]))throw new B("Graph.".concat(e,': an edge linking "').concat(o,'" to "').concat(a,"\" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option."));var f=new H(r,i,c,d,u);return t._edges.set(i,f),o===a?r?(c.undirectedSelfLoops++,t._undirectedSelfLoopCount++):(c.directedSelfLoops++,t._directedSelfLoopCount++):r?(c.undirectedDegree++,d.undirectedDegree++):(c.outDegree++,d.inDegree++),Q(t,r,f,o,a,c,d),r?t._undirectedSize++:t._directedSize++,s.key=i,t.emit("edgeAdded",s),i}function ne(t,e,n,r,i,o,a,u,d){if(!r&&"undirected"===t.type)throw new B("Graph.".concat(e,": you cannot merge/update a directed edge to an undirected graph. Use the #.mergeEdge/#.updateEdge or #.addUndirectedEdge instead."));if(r&&"directed"===t.type)throw new B("Graph.".concat(e,": you cannot merge/update an undirected edge to a directed graph. Use the #.mergeEdge/#.updateEdge or #.addDirectedEdge instead."));if(u)if(d){if("function"!=typeof u)throw new F("Graph.".concat(e,': invalid updater function. Expecting a function but got "').concat(u,'"'))}else if(!h(u))throw new F("Graph.".concat(e,': invalid attributes. Expecting an object but got "').concat(u,'"'));var s;if(o=""+o,a=""+a,d&&(s=u,u=void 0),!t.allowSelfLoops&&o===a)throw new B("Graph.".concat(e,': source & target are the same ("').concat(o,"\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."));var f,p,l=t._nodes.get(o),g=t._nodes.get(a);if(!n&&(f=t._edges.get(i))){if(!(f.source.key===o&&f.target.key===a||r&&f.source.key===a&&f.target.key===o))throw new B("Graph.".concat(e,': inconsistency detected when attempting to merge the "').concat(i,'" edge with "').concat(o,'" source & "').concat(a,'" target vs. ("').concat(f.source.key,'", "').concat(f.target.key,'").'));p=f}if(p||t.multi||!l||(p=r?l.undirected[a]:l.out[a]),p){var y=[p.key,!1,!1,!1];if(d?!s:!u)return y;if(d){var v=p.attributes;p.attributes=s(v),t.emit("edgeAttributesUpdated",{type:"replace",key:p.key,attributes:p.attributes})}else c(p.attributes,u),t.emit("edgeAttributesUpdated",{type:"merge",key:p.key,attributes:p.attributes,data:u});return y}u=u||{},d&&s&&(u=s(u));var b={key:null,undirected:r,source:o,target:a,attributes:u};if(n)i=t._edgeKeyGenerator();else if(i=""+i,t._edges.has(i))throw new B("Graph.".concat(e,': the "').concat(i,'" edge already exists in the graph.'));var w=!1,m=!1;return l||(l=te(t,o,{}),w=!0,o===a&&(g=l,m=!0)),g||(g=te(t,a,{}),m=!0),f=new H(r,i,l,g,u),t._edges.set(i,f),o===a?r?(l.undirectedSelfLoops++,t._undirectedSelfLoopCount++):(l.directedSelfLoops++,t._directedSelfLoopCount++):r?(l.undirectedDegree++,g.undirectedDegree++):(l.outDegree++,g.inDegree++),Q(t,r,f,o,a,l,g),r?t._undirectedSize++:t._directedSize++,b.key=i,t.emit("edgeAdded",b),[i,!0,w,m]}var re=function(n){function r(t){var e;if(e=n.call(this)||this,"boolean"!=typeof(t=c({},$t,t)).multi)throw new F("Graph.constructor: invalid 'multi' option. Expecting a boolean but got \"".concat(t.multi,'".'));if(!Xt.has(t.type))throw new F('Graph.constructor: invalid \'type\' option. Should be one of "mixed", "directed" or "undirected" but got "'.concat(t.type,'".'));if("boolean"!=typeof t.allowSelfLoops)throw new F("Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got \"".concat(t.allowSelfLoops,'".'));var r="mixed"===t.type?q:"directed"===t.type?J:V;p(u(e),"NodeDataClass",r);var i=Qt(),o=0;return p(u(e),"_attributes",{}),p(u(e),"_nodes",new Map),p(u(e),"_edges",new Map),p(u(e),"_directedSize",0),p(u(e),"_undirectedSize",0),p(u(e),"_directedSelfLoopCount",0),p(u(e),"_undirectedSelfLoopCount",0),p(u(e),"_edgeKeyGenerator",(function(){var t;do{t="geid_"+i+"_"+o++}while(e._edges.has(t));return t})),p(u(e),"_options",t),Zt.forEach((function(t){return p(u(e),t,e[t])})),l(u(e),"order",(function(){return e._nodes.size})),l(u(e),"size",(function(){return e._edges.size})),l(u(e),"directedSize",(function(){return e._directedSize})),l(u(e),"undirectedSize",(function(){return e._undirectedSize})),l(u(e),"selfLoopCount",(function(){return e._directedSelfLoopCount+e._undirectedSelfLoopCount})),l(u(e),"directedSelfLoopCount",(function(){return e._directedSelfLoopCount})),l(u(e),"undirectedSelfLoopCount",(function(){return e._undirectedSelfLoopCount})),l(u(e),"multi",e._options.multi),l(u(e),"type",e._options.type),l(u(e),"allowSelfLoops",e._options.allowSelfLoops),l(u(e),"implementation",(function(){return"graphology"})),e}e(r,n);var i=r.prototype;return i._resetInstanceCounters=function(){this._directedSize=0,this._undirectedSize=0,this._directedSelfLoopCount=0,this._undirectedSelfLoopCount=0},i.hasNode=function(t){return this._nodes.has(""+t)},i.hasDirectedEdge=function(t,e){if("undirected"===this.type)return!1;if(1===arguments.length){var n=""+t,r=this._edges.get(n);return!!r&&!r.undirected}if(2===arguments.length){t=""+t,e=""+e;var i=this._nodes.get(t);if(!i)return!1;var o=i.out[e];return!!o&&(!this.multi||!!o.size)}throw new F("Graph.hasDirectedEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},i.hasUndirectedEdge=function(t,e){if("directed"===this.type)return!1;if(1===arguments.length){var n=""+t,r=this._edges.get(n);return!!r&&r.undirected}if(2===arguments.length){t=""+t,e=""+e;var i=this._nodes.get(t);if(!i)return!1;var o=i.undirected[e];return!!o&&(!this.multi||!!o.size)}throw new F("Graph.hasDirectedEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},i.hasEdge=function(t,e){if(1===arguments.length){var n=""+t;return this._edges.has(n)}if(2===arguments.length){t=""+t,e=""+e;var r=this._nodes.get(t);if(!r)return!1;var i=void 0!==r.out&&r.out[e];return i||(i=void 0!==r.undirected&&r.undirected[e]),!!i&&(!this.multi||!!i.size)}throw new F("Graph.hasEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},i.directedEdge=function(t,e){if("undirected"!==this.type){if(t=""+t,e=""+e,this.multi)throw new B("Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.");var n=this._nodes.get(t);if(!n)throw new Y('Graph.directedEdge: could not find the "'.concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y('Graph.directedEdge: could not find the "'.concat(e,'" target node in the graph.'));var r=n.out&&n.out[e]||void 0;return r?r.key:void 0}},i.undirectedEdge=function(t,e){if("directed"!==this.type){if(t=""+t,e=""+e,this.multi)throw new B("Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.");var n=this._nodes.get(t);if(!n)throw new Y('Graph.undirectedEdge: could not find the "'.concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y('Graph.undirectedEdge: could not find the "'.concat(e,'" target node in the graph.'));var r=n.undirected&&n.undirected[e]||void 0;return r?r.key:void 0}},i.edge=function(t,e){if(this.multi)throw new B("Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.");t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.edge: could not find the "'.concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y('Graph.edge: could not find the "'.concat(e,'" target node in the graph.'));var r=n.out&&n.out[e]||n.undirected&&n.undirected[e]||void 0;if(r)return r.key},i.areDirectedNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areDirectedNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&(e in n.in||e in n.out)},i.areOutNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areOutNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&e in n.out},i.areInNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areInNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&e in n.in},i.areUndirectedNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areUndirectedNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"directed"!==this.type&&e in n.undirected},i.areNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&(e in n.in||e in n.out)||"directed"!==this.type&&e in n.undirected},i.areInboundNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areInboundNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&e in n.in||"directed"!==this.type&&e in n.undirected},i.areOutboundNeighbors=function(t,e){t=""+t,e=""+e;var n=this._nodes.get(t);if(!n)throw new Y('Graph.areOutboundNeighbors: could not find the "'.concat(t,'" node in the graph.'));return"undirected"!==this.type&&e in n.out||"directed"!==this.type&&e in n.undirected},i.inDegree=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.inDegree: could not find the "'.concat(t,'" node in the graph.'));return"undirected"===this.type?0:e.inDegree+e.directedSelfLoops},i.outDegree=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.outDegree: could not find the "'.concat(t,'" node in the graph.'));return"undirected"===this.type?0:e.outDegree+e.directedSelfLoops},i.directedDegree=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.directedDegree: could not find the "'.concat(t,'" node in the graph.'));if("undirected"===this.type)return 0;var n=e.directedSelfLoops;return e.inDegree+n+(e.outDegree+n)},i.undirectedDegree=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.undirectedDegree: could not find the "'.concat(t,'" node in the graph.'));if("directed"===this.type)return 0;var n=e.undirectedSelfLoops;return e.undirectedDegree+2*n},i.degree=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.degree: could not find the "'.concat(t,'" node in the graph.'));var n=0;return"directed"!==this.type&&(n+=e.undirectedDegree+2*e.undirectedSelfLoops),"undirected"!==this.type&&(n+=e.inDegree+e.outDegree+2*e.directedSelfLoops),n},i.inDegreeWithoutSelfLoops=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.inDegreeWithoutSelfLoops: could not find the "'.concat(t,'" node in the graph.'));return"undirected"===this.type?0:e.inDegree},i.outDegreeWithoutSelfLoops=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.outDegreeWithoutSelfLoops: could not find the "'.concat(t,'" node in the graph.'));return"undirected"===this.type?0:e.outDegree},i.directedDegreeWithoutSelfLoops=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.directedDegreeWithoutSelfLoops: could not find the "'.concat(t,'" node in the graph.'));return"undirected"===this.type?0:e.inDegree+e.outDegree},i.undirectedDegreeWithoutSelfLoops=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.undirectedDegreeWithoutSelfLoops: could not find the "'.concat(t,'" node in the graph.'));return"directed"===this.type?0:e.undirectedDegree},i.degreeWithoutSelfLoops=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.degreeWithoutSelfLoops: could not find the "'.concat(t,'" node in the graph.'));var n=0;return"directed"!==this.type&&(n+=e.undirectedDegree),"undirected"!==this.type&&(n+=e.inDegree+e.outDegree),n},i.source=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.source: could not find the "'.concat(t,'" edge in the graph.'));return e.source.key},i.target=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.target: could not find the "'.concat(t,'" edge in the graph.'));return e.target.key},i.extremities=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.extremities: could not find the "'.concat(t,'" edge in the graph.'));return[e.source.key,e.target.key]},i.opposite=function(t,e){t=""+t,e=""+e;var n=this._edges.get(e);if(!n)throw new Y('Graph.opposite: could not find the "'.concat(e,'" edge in the graph.'));var r=n.source.key,i=n.target.key;if(t===r)return i;if(t===i)return r;throw new Y('Graph.opposite: the "'.concat(t,'" node is not attached to the "').concat(e,'" edge (').concat(r,", ").concat(i,")."))},i.hasExtremity=function(t,e){t=""+t,e=""+e;var n=this._edges.get(t);if(!n)throw new Y('Graph.hasExtremity: could not find the "'.concat(t,'" edge in the graph.'));return n.source.key===e||n.target.key===e},i.isUndirected=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.isUndirected: could not find the "'.concat(t,'" edge in the graph.'));return e.undirected},i.isDirected=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.isDirected: could not find the "'.concat(t,'" edge in the graph.'));return!e.undirected},i.isSelfLoop=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.isSelfLoop: could not find the "'.concat(t,'" edge in the graph.'));return e.source===e.target},i.addNode=function(t,e){var n=function(t,e,n){if(n&&!h(n))throw new F('Graph.addNode: invalid attributes. Expecting an object but got "'.concat(n,'"'));if(e=""+e,n=n||{},t._nodes.has(e))throw new B('Graph.addNode: the "'.concat(e,'" node already exist in the graph.'));var r=new t.NodeDataClass(e,n);return t._nodes.set(e,r),t.emit("nodeAdded",{key:e,attributes:n}),r}(this,t,e);return n.key},i.mergeNode=function(t,e){if(e&&!h(e))throw new F('Graph.mergeNode: invalid attributes. Expecting an object but got "'.concat(e,'"'));t=""+t,e=e||{};var n=this._nodes.get(t);return n?(e&&(c(n.attributes,e),this.emit("nodeAttributesUpdated",{type:"merge",key:t,attributes:n.attributes,data:e})),[t,!1]):(n=new this.NodeDataClass(t,e),this._nodes.set(t,n),this.emit("nodeAdded",{key:t,attributes:e}),[t,!0])},i.updateNode=function(t,e){if(e&&"function"!=typeof e)throw new F('Graph.updateNode: invalid updater function. Expecting a function but got "'.concat(e,'"'));t=""+t;var n=this._nodes.get(t);if(n){if(e){var r=n.attributes;n.attributes=e(r),this.emit("nodeAttributesUpdated",{type:"replace",key:t,attributes:n.attributes})}return[t,!1]}var i=e?e({}):{};return n=new this.NodeDataClass(t,i),this._nodes.set(t,n),this.emit("nodeAdded",{key:t,attributes:i}),[t,!0]},i.dropNode=function(t){var e=this;t=""+t;var n=this._nodes.get(t);if(!n)throw new Y('Graph.dropNode: could not find the "'.concat(t,'" node in the graph.'));this.forEachEdge(t,(function(t){e.dropEdge(t)})),this._nodes.delete(t),this.emit("nodeDropped",{key:t,attributes:n.attributes})},i.dropEdge=function(t){var e;if(arguments.length>1){var n=""+arguments[0],r=""+arguments[1];if(!(e=d(this,n,r,this.type)))throw new Y('Graph.dropEdge: could not find the "'.concat(n,'" -> "').concat(r,'" edge in the graph.'))}else if(t=""+t,!(e=this._edges.get(t)))throw new Y('Graph.dropEdge: could not find the "'.concat(t,'" edge in the graph.'));this._edges.delete(e.key);var i=e,o=i.source,a=i.target,u=i.attributes,c=e.undirected;return o===a?c?(o.undirectedSelfLoops--,this._undirectedSelfLoopCount--):(o.directedSelfLoops--,this._directedSelfLoopCount--):c?(o.undirectedDegree--,a.undirectedDegree--):(o.outDegree--,a.inDegree--),X(this,c,e),c?this._undirectedSize--:this._directedSize--,this.emit("edgeDropped",{key:t,attributes:u,source:o.key,target:a.key,undirected:c}),this},i.clear=function(){this._edges.clear(),this._nodes.clear(),this._resetInstanceCounters(),this.emit("cleared")},i.clearEdges=function(){!function(t){for(var e,n=t._nodes.values();!0!==(e=n.next()).done;)e.value.clear()}(this),this._edges.clear(),this._resetInstanceCounters(),this.emit("edgesCleared")},i.getAttribute=function(t){return this._attributes[t]},i.getAttributes=function(){return this._attributes},i.hasAttribute=function(t){return this._attributes.hasOwnProperty(t)},i.setAttribute=function(t,e){return this._attributes[t]=e,this.emit("attributesUpdated",{type:"set",attributes:this._attributes,name:t}),this},i.updateAttribute=function(t,e){if("function"!=typeof e)throw new F("Graph.updateAttribute: updater should be a function.");var n=this._attributes[t];return this._attributes[t]=e(n),this.emit("attributesUpdated",{type:"set",attributes:this._attributes,name:t}),this},i.removeAttribute=function(t){return delete this._attributes[t],this.emit("attributesUpdated",{type:"remove",attributes:this._attributes,name:t}),this},i.replaceAttributes=function(t){if(!h(t))throw new F("Graph.replaceAttributes: provided attributes are not a plain object.");return this._attributes=t,this.emit("attributesUpdated",{type:"replace",attributes:this._attributes}),this},i.mergeAttributes=function(t){if(!h(t))throw new F("Graph.mergeAttributes: provided attributes are not a plain object.");return c(this._attributes,t),this.emit("attributesUpdated",{type:"merge",attributes:this._attributes,data:t}),this},i.updateAttributes=function(t){if("function"!=typeof t)throw new F("Graph.updateAttributes: provided updater is not a function.");return this._attributes=t(this._attributes),this.emit("attributesUpdated",{type:"update",attributes:this._attributes}),this},i.updateEachNodeAttributes=function(t,e){if("function"!=typeof t)throw new F("Graph.updateEachNodeAttributes: expecting an updater function.");if(e&&!g(e))throw new F("Graph.updateEachNodeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");for(var n,r,i=this._nodes.values();!0!==(n=i.next()).done;)(r=n.value).attributes=t(r.key,r.attributes);this.emit("eachNodeAttributesUpdated",{hints:e||null})},i.updateEachEdgeAttributes=function(t,e){if("function"!=typeof t)throw new F("Graph.updateEachEdgeAttributes: expecting an updater function.");if(e&&!g(e))throw new F("Graph.updateEachEdgeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");for(var n,r,i,o,a=this._edges.values();!0!==(n=a.next()).done;)i=(r=n.value).source,o=r.target,r.attributes=t(r.key,r.attributes,i.key,o.key,i.attributes,o.attributes,r.undirected);this.emit("eachEdgeAttributesUpdated",{hints:e||null})},i.forEachAdjacencyEntry=function(t){if("function"!=typeof t)throw new F("Graph.forEachAdjacencyEntry: expecting a callback.");this.multi?Yt(!1,!1,!1,this,t):Ft(!1,!1,!1,this,t)},i.forEachAdjacencyEntryWithOrphans=function(t){if("function"!=typeof t)throw new F("Graph.forEachAdjacencyEntryWithOrphans: expecting a callback.");this.multi?Yt(!1,!1,!0,this,t):Ft(!1,!1,!0,this,t)},i.forEachAssymetricAdjacencyEntry=function(t){if("function"!=typeof t)throw new F("Graph.forEachAssymetricAdjacencyEntry: expecting a callback.");this.multi?Yt(!1,!0,!1,this,t):Ft(!1,!0,!1,this,t)},i.forEachAssymetricAdjacencyEntryWithOrphans=function(t){if("function"!=typeof t)throw new F("Graph.forEachAssymetricAdjacencyEntryWithOrphans: expecting a callback.");this.multi?Yt(!1,!0,!0,this,t):Ft(!1,!0,!0,this,t)},i.nodes=function(){return"function"==typeof Array.from?Array.from(this._nodes.keys()):K(this._nodes.keys(),this._nodes.size)},i.forEachNode=function(t){if("function"!=typeof t)throw new F("Graph.forEachNode: expecting a callback.");for(var e,n,r=this._nodes.values();!0!==(e=r.next()).done;)t((n=e.value).key,n.attributes)},i.findNode=function(t){if("function"!=typeof t)throw new F("Graph.findNode: expecting a callback.");for(var e,n,r=this._nodes.values();!0!==(e=r.next()).done;)if(t((n=e.value).key,n.attributes))return n.key},i.mapNodes=function(t){if("function"!=typeof t)throw new F("Graph.mapNode: expecting a callback.");for(var e,n,r=this._nodes.values(),i=new Array(this.order),o=0;!0!==(e=r.next()).done;)n=e.value,i[o++]=t(n.key,n.attributes);return i},i.someNode=function(t){if("function"!=typeof t)throw new F("Graph.someNode: expecting a callback.");for(var e,n,r=this._nodes.values();!0!==(e=r.next()).done;)if(t((n=e.value).key,n.attributes))return!0;return!1},i.everyNode=function(t){if("function"!=typeof t)throw new F("Graph.everyNode: expecting a callback.");for(var e,n,r=this._nodes.values();!0!==(e=r.next()).done;)if(!t((n=e.value).key,n.attributes))return!1;return!0},i.filterNodes=function(t){if("function"!=typeof t)throw new F("Graph.filterNodes: expecting a callback.");for(var e,n,r=this._nodes.values(),i=[];!0!==(e=r.next()).done;)t((n=e.value).key,n.attributes)&&i.push(n.key);return i},i.reduceNodes=function(t,e){if("function"!=typeof t)throw new F("Graph.reduceNodes: expecting a callback.");if(arguments.length<2)throw new F("Graph.reduceNodes: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.");for(var n,r,i=e,o=this._nodes.values();!0!==(n=o.next()).done;)i=t(i,(r=n.value).key,r.attributes);return i},i.nodeEntries=function(){var t=this._nodes.values();return new O((function(){var e=t.next();if(e.done)return e;var n=e.value;return{value:{node:n.key,attributes:n.attributes},done:!1}}))},i.exportNode=function(t){t=""+t;var e=this._nodes.get(t);if(!e)throw new Y('Graph.exportNode: could not find the "'.concat(t,'" node in the graph.'));return Bt(t,e)},i.exportEdge=function(t){t=""+t;var e=this._edges.get(t);if(!e)throw new Y('Graph.exportEdge: could not find the "'.concat(t,'" edge in the graph.'));return qt(t,e)},i.export=function(){var t=new Array(this._nodes.size),e=0;this._nodes.forEach((function(n,r){t[e++]=Bt(r,n)}));var n=new Array(this._edges.size);return e=0,this._edges.forEach((function(t,r){n[e++]=qt(r,t)})),{attributes:this.getAttributes(),nodes:t,edges:n,options:{type:this.type,multi:this.multi,allowSelfLoops:this.allowSelfLoops}}},i.importNode=function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=Jt(t);if(n){if("not-object"===n)throw new F('Graph.importNode: invalid serialized node. A serialized node should be a plain object with at least a "key" property.');if("no-key"===n)throw new F("Graph.importNode: no key provided.");if("invalid-attributes"===n)throw new F("Graph.importNode: invalid attributes. Attributes should be a plain object, null or omitted.")}var r=t.key,i=t.attributes,o=void 0===i?{}:i;return e?this.mergeNode(r,o):this.addNode(r,o),this},i.importEdge=function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=Vt(t);if(n){if("not-object"===n)throw new F('Graph.importEdge: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.');if("no-source"===n)throw new F("Graph.importEdge: missing souce.");if("no-target"===n)throw new F("Graph.importEdge: missing target.");if("invalid-attributes"===n)throw new F("Graph.importEdge: invalid attributes. Attributes should be a plain object, null or omitted.");if("invalid-undirected"===n)throw new F("Graph.importEdge: invalid undirected. Undirected should be boolean or omitted.")}var r=t.source,i=t.target,o=t.attributes,a=void 0===o?{}:o,u=t.undirected,c=void 0!==u&&u;return"key"in t?(e?c?this.mergeUndirectedEdgeWithKey:this.mergeDirectedEdgeWithKey:c?this.addUndirectedEdgeWithKey:this.addDirectedEdgeWithKey).call(this,t.key,r,i,a):(e?c?this.mergeUndirectedEdge:this.mergeDirectedEdge:c?this.addUndirectedEdge:this.addDirectedEdge).call(this,r,i,a),this},i.import=function(t){var e,n,r,i=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(s(t))return this.import(t.export(),i),this;if(!h(t))throw new F("Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.");if(t.attributes){if(!h(t.attributes))throw new F("Graph.import: invalid attributes. Expecting a plain object.");i?this.mergeAttributes(t.attributes):this.replaceAttributes(t.attributes)}if(t.nodes){if(r=t.nodes,!Array.isArray(r))throw new F("Graph.import: invalid nodes. Expecting an array.");for(e=0,n=r.length;e<n;e++)this.importNode(r[e],i)}if(t.edges){if(r=t.edges,!Array.isArray(r))throw new F("Graph.import: invalid edges. Expecting an array.");for(e=0,n=r.length;e<n;e++)this.importEdge(r[e],i)}return this},i.nullCopy=function(t){var e=new r(c({},this._options,t));return e.replaceAttributes(c({},this.getAttributes())),e},i.emptyCopy=function(t){var e=this.nullCopy(t);return this._nodes.forEach((function(t,n){var r=c({},t.attributes);t=new e.NodeDataClass(n,r),e._nodes.set(n,t)})),e},i.copy=function(){for(var t,e,n=this.emptyCopy(),r=this._edges.values();!0!==(t=r.next()).done;)ee(n,"copy",!1,(e=t.value).undirected,e.key,e.source.key,e.target.key,c({},e.attributes));return n},i.upgradeToMixed=function(){return"mixed"===this.type||(this._nodes.forEach((function(t){return t.upgradeToMixed()})),this._options.type="mixed",l(this,"type",this._options.type),p(this,"NodeDataClass",q)),this},i.upgradeToMulti=function(){return this.multi||(this._options.multi=!0,l(this,"multi",!0),(t=this)._nodes.forEach((function(e,n){if(e.out)for(var r in e.out){var i=new Set;i.add(e.out[r]),e.out[r]=i,t._nodes.get(r).in[n]=i}if(e.undirected)for(var o in e.undirected)if(!(o>n)){var a=new Set;a.add(e.undirected[o]),e.undirected[o]=a,t._nodes.get(o).undirected[n]=a}}))),this;var t},i.toJSON=function(){return this.export()},i.toString=function(){return"[object Graph]"},i.inspect=function(){var e=this,n={};this._nodes.forEach((function(t,e){n[e]=t.attributes}));var r={},i={};this._edges.forEach((function(t,n){var o,a=t.undirected?"--":"->",u="",c=t.source.key,d=t.target.key;t.undirected&&c>d&&(o=c,c=d,d=o);var s="(".concat(c,")").concat(a,"(").concat(d,")");n.startsWith("geid_")?e.multi&&(void 0===i[s]?i[s]=0:i[s]++,u+="".concat(i[s],". ")):u+="[".concat(n,"]: "),r[u+=s]=t.attributes}));var o={};for(var a in this)this.hasOwnProperty(a)&&!Zt.has(a)&&"function"!=typeof this[a]&&"symbol"!==t(a)&&(o[a]=this[a]);return o.attributes=this._attributes,o.nodes=n,o.edges=r,p(o,"constructor",this.constructor),o},r}(v.exports.EventEmitter);"undefined"!=typeof Symbol&&(re.prototype[Symbol.for("nodejs.util.inspect.custom")]=re.prototype.inspect),[{name:function(t){return"".concat(t,"Edge")},generateKey:!0},{name:function(t){return"".concat(t,"DirectedEdge")},generateKey:!0,type:"directed"},{name:function(t){return"".concat(t,"UndirectedEdge")},generateKey:!0,type:"undirected"},{name:function(t){return"".concat(t,"EdgeWithKey")}},{name:function(t){return"".concat(t,"DirectedEdgeWithKey")},type:"directed"},{name:function(t){return"".concat(t,"UndirectedEdgeWithKey")},type:"undirected"}].forEach((function(t){["add","merge","update"].forEach((function(e){var n=t.name(e),r="add"===e?ee:ne;t.generateKey?re.prototype[n]=function(i,o,a){return r(this,n,!0,"undirected"===(t.type||this.type),null,i,o,a,"update"===e)}:re.prototype[n]=function(i,o,a,u){return r(this,n,!1,"undirected"===(t.type||this.type),i,o,a,u,"update"===e)}}))})),function(t){$.forEach((function(e){var n=e.name,r=e.attacher;r(t,n("Node"),0),r(t,n("Source"),1),r(t,n("Target"),2),r(t,n("Opposite"),3)}))}(re),function(t){tt.forEach((function(e){var n=e.name,r=e.attacher;r(t,n("Edge"),"mixed"),r(t,n("DirectedEdge"),"directed"),r(t,n("UndirectedEdge"),"undirected")}))}(re),function(t){it.forEach((function(e){!function(t,e){var n=e.name,r=e.type,i=e.direction;t.prototype[n]=function(t,e){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return[];if(!arguments.length)return wt(this,r);if(1===arguments.length){t=""+t;var o=this._nodes.get(t);if(void 0===o)throw new Y("Graph.".concat(n,': could not find the "').concat(t,'" node in the graph.'));return Gt(this.multi,"mixed"===r?this.type:r,i,o)}if(2===arguments.length){t=""+t,e=""+e;var a=this._nodes.get(t);if(!a)throw new Y("Graph.".concat(n,':  could not find the "').concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y("Graph.".concat(n,':  could not find the "').concat(e,'" target node in the graph.'));return At(r,this.multi,i,a,e)}throw new F("Graph.".concat(n,": too many arguments (expecting 0, 1 or 2 and got ").concat(arguments.length,")."))}}(t,e),function(t,e){var n=e.name,r=e.type,i=e.direction,o="forEach"+n[0].toUpperCase()+n.slice(1,-1);t.prototype[o]=function(t,e,n){if("mixed"===r||"mixed"===this.type||r===this.type){if(1===arguments.length)return mt(this,r,n=t);if(2===arguments.length){t=""+t,n=e;var a=this._nodes.get(t);if(void 0===a)throw new Y("Graph.".concat(o,': could not find the "').concat(t,'" node in the graph.'));return xt(this.multi,"mixed"===r?this.type:r,i,a,n)}if(3===arguments.length){t=""+t,e=""+e;var u=this._nodes.get(t);if(!u)throw new Y("Graph.".concat(o,':  could not find the "').concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y("Graph.".concat(o,':  could not find the "').concat(e,'" target node in the graph.'));return Lt(r,this.multi,i,u,e,n)}throw new F("Graph.".concat(o,": too many arguments (expecting 1, 2 or 3 and got ").concat(arguments.length,")."))}};var a="map"+n[0].toUpperCase()+n.slice(1);t.prototype[a]=function(){var t,e=Array.prototype.slice.call(arguments),n=e.pop();if(0===e.length){var i=0;"directed"!==r&&(i+=this.undirectedSize),"undirected"!==r&&(i+=this.directedSize),t=new Array(i);var a=0;e.push((function(e,r,i,o,u,c,d){t[a++]=n(e,r,i,o,u,c,d)}))}else t=[],e.push((function(e,r,i,o,a,u,c){t.push(n(e,r,i,o,a,u,c))}));return this[o].apply(this,e),t};var u="filter"+n[0].toUpperCase()+n.slice(1);t.prototype[u]=function(){var t=Array.prototype.slice.call(arguments),e=t.pop(),n=[];return t.push((function(t,r,i,o,a,u,c){e(t,r,i,o,a,u,c)&&n.push(t)})),this[o].apply(this,t),n};var c="reduce"+n[0].toUpperCase()+n.slice(1);t.prototype[c]=function(){var t,e,n=Array.prototype.slice.call(arguments);if(n.length<2||n.length>4)throw new F("Graph.".concat(c,": invalid number of arguments (expecting 2, 3 or 4 and got ").concat(n.length,")."));if("function"==typeof n[n.length-1]&&"function"!=typeof n[n.length-2])throw new F("Graph.".concat(c,": missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array."));2===n.length?(t=n[0],e=n[1],n=[]):3===n.length?(t=n[1],e=n[2],n=[n[0]]):4===n.length&&(t=n[2],e=n[3],n=[n[0],n[1]]);var r=e;return n.push((function(e,n,i,o,a,u,c){r=t(r,e,n,i,o,a,u,c)})),this[o].apply(this,n),r}}(t,e),function(t,e){var n=e.name,r=e.type,i=e.direction,o="find"+n[0].toUpperCase()+n.slice(1,-1);t.prototype[o]=function(t,e,n){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return!1;if(1===arguments.length)return _t(this,r,n=t);if(2===arguments.length){t=""+t,n=e;var a=this._nodes.get(t);if(void 0===a)throw new Y("Graph.".concat(o,': could not find the "').concat(t,'" node in the graph.'));return Et(this.multi,"mixed"===r?this.type:r,i,a,n)}if(3===arguments.length){t=""+t,e=""+e;var u=this._nodes.get(t);if(!u)throw new Y("Graph.".concat(o,':  could not find the "').concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y("Graph.".concat(o,':  could not find the "').concat(e,'" target node in the graph.'));return Dt(r,this.multi,i,u,e,n)}throw new F("Graph.".concat(o,": too many arguments (expecting 1, 2 or 3 and got ").concat(arguments.length,")."))};var a="some"+n[0].toUpperCase()+n.slice(1,-1);t.prototype[a]=function(){var t=Array.prototype.slice.call(arguments),e=t.pop();return t.push((function(t,n,r,i,o,a,u){return e(t,n,r,i,o,a,u)})),!!this[o].apply(this,t)};var u="every"+n[0].toUpperCase()+n.slice(1,-1);t.prototype[u]=function(){var t=Array.prototype.slice.call(arguments),e=t.pop();return t.push((function(t,n,r,i,o,a,u){return!e(t,n,r,i,o,a,u)})),!this[o].apply(this,t)}}(t,e),function(t,e){var n=e.name,r=e.type,i=e.direction,o=n.slice(0,-1)+"Entries";t.prototype[o]=function(t,e){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return O.empty();if(!arguments.length)return kt(this,r);if(1===arguments.length){t=""+t;var n=this._nodes.get(t);if(!n)throw new Y("Graph.".concat(o,': could not find the "').concat(t,'" node in the graph.'));return St(r,i,n)}if(2===arguments.length){t=""+t,e=""+e;var a=this._nodes.get(t);if(!a)throw new Y("Graph.".concat(o,':  could not find the "').concat(t,'" source node in the graph.'));if(!this._nodes.has(e))throw new Y("Graph.".concat(o,':  could not find the "').concat(e,'" target node in the graph.'));return Nt(r,i,a,e)}throw new F("Graph.".concat(o,": too many arguments (expecting 0, 1 or 2 and got ").concat(arguments.length,")."))}}(t,e)}))}(re),function(t){Ut.forEach((function(e){Rt(t,e),Wt(t,e),Kt(t,e),It(t,e)}))}(re);var ie=function(t){function n(e){var n=c({type:"directed"},e);if("multi"in n&&!1!==n.multi)throw new F("DirectedGraph.from: inconsistent indication that the graph should be multi in given options!");if("directed"!==n.type)throw new F('DirectedGraph.from: inconsistent "'+n.type+'" type in given options!');return t.call(this,n)||this}return e(n,t),n}(re),oe=function(t){function n(e){var n=c({type:"undirected"},e);if("multi"in n&&!1!==n.multi)throw new F("UndirectedGraph.from: inconsistent indication that the graph should be multi in given options!");if("undirected"!==n.type)throw new F('UndirectedGraph.from: inconsistent "'+n.type+'" type in given options!');return t.call(this,n)||this}return e(n,t),n}(re),ae=function(t){function n(e){var n=c({multi:!0},e);if("multi"in n&&!0!==n.multi)throw new F("MultiGraph.from: inconsistent indication that the graph should be simple in given options!");return t.call(this,n)||this}return e(n,t),n}(re),ue=function(t){function n(e){var n=c({type:"directed",multi:!0},e);if("multi"in n&&!0!==n.multi)throw new F("MultiDirectedGraph.from: inconsistent indication that the graph should be simple in given options!");if("directed"!==n.type)throw new F('MultiDirectedGraph.from: inconsistent "'+n.type+'" type in given options!');return t.call(this,n)||this}return e(n,t),n}(re),ce=function(t){function n(e){var n=c({type:"undirected",multi:!0},e);if("multi"in n&&!0!==n.multi)throw new F("MultiUndirectedGraph.from: inconsistent indication that the graph should be simple in given options!");if("undirected"!==n.type)throw new F('MultiUndirectedGraph.from: inconsistent "'+n.type+'" type in given options!');return t.call(this,n)||this}return e(n,t),n}(re);function de(t){t.from=function(e,n){var r=c({},e.options,n),i=new t(r);return i.import(e),i}}return de(re),de(ie),de(oe),de(ae),de(ue),de(ce),re.Graph=re,re.DirectedGraph=ie,re.UndirectedGraph=oe,re.MultiGraph=ae,re.MultiDirectedGraph=ue,re.MultiUndirectedGraph=ce,re.InvalidArgumentsGraphError=F,re.NotFoundGraphError=Y,re.UsageGraphError=B,re}));
//# sourceMappingURL=graphology.umd.min.js.map


/***/ }),

/***/ "./node_modules/sigma/core/camera.js":
/*!*******************************************!*\
  !*** ./node_modules/sigma/core/camera.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sigma.js Camera Class
 * ======================
 *
 * Class designed to store camera information & used to update it.
 * @module
 */
var animate_1 = __webpack_require__(/*! ../utils/animate */ "./node_modules/sigma/utils/animate.js");
var easings_1 = __importDefault(__webpack_require__(/*! ../utils/easings */ "./node_modules/sigma/utils/easings.js"));
var utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/sigma/utils/index.js");
var types_1 = __webpack_require__(/*! ../types */ "./node_modules/sigma/types.js");
/**
 * Defaults.
 */
var DEFAULT_ZOOMING_RATIO = 1.5;
/**
 * Camera class
 *
 * @constructor
 */
var Camera = /** @class */ (function (_super) {
    __extends(Camera, _super);
    function Camera() {
        var _this = _super.call(this) || this;
        _this.x = 0.5;
        _this.y = 0.5;
        _this.angle = 0;
        _this.ratio = 1;
        _this.minRatio = null;
        _this.maxRatio = null;
        _this.nextFrame = null;
        _this.previousState = null;
        _this.enabled = true;
        // State
        _this.previousState = _this.getState();
        return _this;
    }
    /**
     * Static method used to create a Camera object with a given state.
     *
     * @param state
     * @return {Camera}
     */
    Camera.from = function (state) {
        var camera = new Camera();
        return camera.setState(state);
    };
    /**
     * Method used to enable the camera.
     *
     * @return {Camera}
     */
    Camera.prototype.enable = function () {
        this.enabled = true;
        return this;
    };
    /**
     * Method used to disable the camera.
     *
     * @return {Camera}
     */
    Camera.prototype.disable = function () {
        this.enabled = false;
        return this;
    };
    /**
     * Method used to retrieve the camera's current state.
     *
     * @return {object}
     */
    Camera.prototype.getState = function () {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            ratio: this.ratio,
        };
    };
    /**
     * Method used to check whether the camera has the given state.
     *
     * @return {object}
     */
    Camera.prototype.hasState = function (state) {
        return this.x === state.x && this.y === state.y && this.ratio === state.ratio && this.angle === state.angle;
    };
    /**
     * Method used to retrieve the camera's previous state.
     *
     * @return {object}
     */
    Camera.prototype.getPreviousState = function () {
        var state = this.previousState;
        if (!state)
            return null;
        return {
            x: state.x,
            y: state.y,
            angle: state.angle,
            ratio: state.ratio,
        };
    };
    /**
     * Method used to check minRatio and maxRatio values.
     *
     * @param ratio
     * @return {number}
     */
    Camera.prototype.getBoundedRatio = function (ratio) {
        var r = ratio;
        if (typeof this.minRatio === "number")
            r = Math.max(r, this.minRatio);
        if (typeof this.maxRatio === "number")
            r = Math.min(r, this.maxRatio);
        return r;
    };
    /**
     * Method used to check various things to return a legit state candidate.
     *
     * @param state
     * @return {object}
     */
    Camera.prototype.validateState = function (state) {
        var validatedState = {};
        if (typeof state.x === "number")
            validatedState.x = state.x;
        if (typeof state.y === "number")
            validatedState.y = state.y;
        if (typeof state.angle === "number")
            validatedState.angle = state.angle;
        if (typeof state.ratio === "number")
            validatedState.ratio = this.getBoundedRatio(state.ratio);
        return validatedState;
    };
    /**
     * Method used to check whether the camera is currently being animated.
     *
     * @return {boolean}
     */
    Camera.prototype.isAnimated = function () {
        return !!this.nextFrame;
    };
    /**
     * Method used to set the camera's state.
     *
     * @param  {object} state - New state.
     * @return {Camera}
     */
    Camera.prototype.setState = function (state) {
        if (!this.enabled)
            return this;
        // TODO: update by function
        // Keeping track of last state
        this.previousState = this.getState();
        var validState = this.validateState(state);
        if (typeof validState.x === "number")
            this.x = validState.x;
        if (typeof validState.y === "number")
            this.y = validState.y;
        if (typeof validState.angle === "number")
            this.angle = validState.angle;
        if (typeof validState.ratio === "number")
            this.ratio = validState.ratio;
        // Emitting
        if (!this.hasState(this.previousState))
            this.emit("updated", this.getState());
        return this;
    };
    /**
     * Method used to update the camera's state using a function.
     *
     * @param  {function} updater - Updated function taking current state and
     *                              returning next state.
     * @return {Camera}
     */
    Camera.prototype.updateState = function (updater) {
        this.setState(updater(this.getState()));
        return this;
    };
    /**
     * Method used to animate the camera.
     *
     * @param  {object}                    state      - State to reach eventually.
     * @param  {object}                    opts       - Options:
     * @param  {number}                      duration - Duration of the animation.
     * @param  {string | number => number}   easing   - Easing function or name of an existing one
     * @param  {function}                  callback   - Callback
     */
    Camera.prototype.animate = function (state, opts, callback) {
        var _this = this;
        if (!this.enabled)
            return;
        var options = Object.assign({}, animate_1.ANIMATE_DEFAULTS, opts);
        var validState = this.validateState(state);
        var easing = typeof options.easing === "function" ? options.easing : easings_1.default[options.easing];
        // State
        var start = Date.now(), initialState = this.getState();
        // Function performing the animation
        var fn = function () {
            var t = (Date.now() - start) / options.duration;
            // The animation is over:
            if (t >= 1) {
                _this.nextFrame = null;
                _this.setState(validState);
                if (_this.animationCallback) {
                    _this.animationCallback.call(null);
                    _this.animationCallback = undefined;
                }
                return;
            }
            var coefficient = easing(t);
            var newState = {};
            if (typeof validState.x === "number")
                newState.x = initialState.x + (validState.x - initialState.x) * coefficient;
            if (typeof validState.y === "number")
                newState.y = initialState.y + (validState.y - initialState.y) * coefficient;
            if (typeof validState.angle === "number")
                newState.angle = initialState.angle + (validState.angle - initialState.angle) * coefficient;
            if (typeof validState.ratio === "number")
                newState.ratio = initialState.ratio + (validState.ratio - initialState.ratio) * coefficient;
            _this.setState(newState);
            _this.nextFrame = (0, utils_1.requestFrame)(fn);
        };
        if (this.nextFrame) {
            (0, utils_1.cancelFrame)(this.nextFrame);
            if (this.animationCallback)
                this.animationCallback.call(null);
            this.nextFrame = (0, utils_1.requestFrame)(fn);
        }
        else {
            fn();
        }
        this.animationCallback = callback;
    };
    /**
     * Method used to zoom the camera.
     *
     * @param  {number|object} factorOrOptions - Factor or options.
     * @return {function}
     */
    Camera.prototype.animatedZoom = function (factorOrOptions) {
        if (!factorOrOptions) {
            this.animate({ ratio: this.ratio / DEFAULT_ZOOMING_RATIO });
        }
        else {
            if (typeof factorOrOptions === "number")
                return this.animate({ ratio: this.ratio / factorOrOptions });
            else
                this.animate({
                    ratio: this.ratio / (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO),
                }, factorOrOptions);
        }
    };
    /**
     * Method used to unzoom the camera.
     *
     * @param  {number|object} factorOrOptions - Factor or options.
     */
    Camera.prototype.animatedUnzoom = function (factorOrOptions) {
        if (!factorOrOptions) {
            this.animate({ ratio: this.ratio * DEFAULT_ZOOMING_RATIO });
        }
        else {
            if (typeof factorOrOptions === "number")
                return this.animate({ ratio: this.ratio * factorOrOptions });
            else
                this.animate({
                    ratio: this.ratio * (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO),
                }, factorOrOptions);
        }
    };
    /**
     * Method used to reset the camera.
     *
     * @param  {object} options - Options.
     */
    Camera.prototype.animatedReset = function (options) {
        this.animate({
            x: 0.5,
            y: 0.5,
            ratio: 1,
            angle: 0,
        }, options);
    };
    /**
     * Returns a new Camera instance, with the same state as the current camera.
     *
     * @return {Camera}
     */
    Camera.prototype.copy = function () {
        return Camera.from(this.getState());
    };
    return Camera;
}(types_1.TypedEventEmitter));
exports["default"] = Camera;


/***/ }),

/***/ "./node_modules/sigma/core/captors/captor.js":
/*!***************************************************!*\
  !*** ./node_modules/sigma/core/captors/captor.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getWheelDelta = exports.getTouchCoords = exports.getTouchesArray = exports.getWheelCoords = exports.getMouseCoords = exports.getPosition = void 0;
/**
 * Sigma.js Captor Class
 * ======================
 * @module
 */
var types_1 = __webpack_require__(/*! ../../types */ "./node_modules/sigma/types.js");
/**
 * Captor utils functions
 * ======================
 */
/**
 * Extract the local X and Y coordinates from a mouse event or touch object. If
 * a DOM element is given, it uses this element's offset to compute the position
 * (this allows using events that are not bound to the container itself and
 * still have a proper position).
 *
 * @param  {event}       e - A mouse event or touch object.
 * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
 * @return {number}      The local Y value of the mouse.
 */
function getPosition(e, dom) {
    var bbox = dom.getBoundingClientRect();
    return {
        x: e.clientX - bbox.left,
        y: e.clientY - bbox.top,
    };
}
exports.getPosition = getPosition;
/**
 * Convert mouse coords to sigma coords.
 *
 * @param  {event}       e   - A mouse event or touch object.
 * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
 * @return {object}
 */
function getMouseCoords(e, dom) {
    var res = __assign(__assign({}, getPosition(e, dom)), { sigmaDefaultPrevented: false, preventSigmaDefault: function () {
            res.sigmaDefaultPrevented = true;
        }, original: e });
    return res;
}
exports.getMouseCoords = getMouseCoords;
/**
 * Convert mouse wheel event coords to sigma coords.
 *
 * @param  {event}       e   - A wheel mouse event.
 * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
 * @return {object}
 */
function getWheelCoords(e, dom) {
    return __assign(__assign({}, getMouseCoords(e, dom)), { delta: getWheelDelta(e) });
}
exports.getWheelCoords = getWheelCoords;
var MAX_TOUCHES = 2;
function getTouchesArray(touches) {
    var arr = [];
    for (var i = 0, l = Math.min(touches.length, MAX_TOUCHES); i < l; i++)
        arr.push(touches[i]);
    return arr;
}
exports.getTouchesArray = getTouchesArray;
/**
 * Convert touch coords to sigma coords.
 *
 * @param  {event}       e   - A touch event.
 * @param  {HTMLElement} dom - A DOM element to compute offset relatively to.
 * @return {object}
 */
function getTouchCoords(e, dom) {
    return {
        touches: getTouchesArray(e.touches).map(function (touch) { return getPosition(touch, dom); }),
        original: e,
    };
}
exports.getTouchCoords = getTouchCoords;
/**
 * Extract the wheel delta from a mouse event or touch object.
 *
 * @param  {event}  e - A mouse event or touch object.
 * @return {number}     The wheel delta of the mouse.
 */
function getWheelDelta(e) {
    // TODO: check those ratios again to ensure a clean Chrome/Firefox compat
    if (typeof e.deltaY !== "undefined")
        return (e.deltaY * -3) / 360;
    if (typeof e.detail !== "undefined")
        return e.detail / -9;
    throw new Error("Captor: could not extract delta from event.");
}
exports.getWheelDelta = getWheelDelta;
/**
 * Abstract class representing a captor like the user's mouse or touch controls.
 */
var Captor = /** @class */ (function (_super) {
    __extends(Captor, _super);
    function Captor(container, renderer) {
        var _this = _super.call(this) || this;
        // Properties
        _this.container = container;
        _this.renderer = renderer;
        return _this;
    }
    return Captor;
}(types_1.TypedEventEmitter));
exports["default"] = Captor;


/***/ }),

/***/ "./node_modules/sigma/core/captors/mouse.js":
/*!**************************************************!*\
  !*** ./node_modules/sigma/core/captors/mouse.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var captor_1 = __importStar(__webpack_require__(/*! ./captor */ "./node_modules/sigma/core/captors/captor.js"));
/**
 * Constants.
 */
var DRAG_TIMEOUT = 100;
var DRAGGED_EVENTS_TOLERANCE = 3;
var MOUSE_INERTIA_DURATION = 200;
var MOUSE_INERTIA_RATIO = 3;
var MOUSE_ZOOM_DURATION = 250;
var ZOOMING_RATIO = 1.7;
var DOUBLE_CLICK_TIMEOUT = 300;
var DOUBLE_CLICK_ZOOMING_RATIO = 2.2;
var DOUBLE_CLICK_ZOOMING_DURATION = 200;
/**
 * Mouse captor class.
 *
 * @constructor
 */
var MouseCaptor = /** @class */ (function (_super) {
    __extends(MouseCaptor, _super);
    function MouseCaptor(container, renderer) {
        var _this = _super.call(this, container, renderer) || this;
        // State
        _this.enabled = true;
        _this.draggedEvents = 0;
        _this.downStartTime = null;
        _this.lastMouseX = null;
        _this.lastMouseY = null;
        _this.isMouseDown = false;
        _this.isMoving = false;
        _this.movingTimeout = null;
        _this.startCameraState = null;
        _this.clicks = 0;
        _this.doubleClickTimeout = null;
        _this.currentWheelDirection = 0;
        // Binding methods
        _this.handleClick = _this.handleClick.bind(_this);
        _this.handleRightClick = _this.handleRightClick.bind(_this);
        _this.handleDown = _this.handleDown.bind(_this);
        _this.handleUp = _this.handleUp.bind(_this);
        _this.handleMove = _this.handleMove.bind(_this);
        _this.handleWheel = _this.handleWheel.bind(_this);
        _this.handleOut = _this.handleOut.bind(_this);
        // Binding events
        container.addEventListener("click", _this.handleClick, false);
        container.addEventListener("contextmenu", _this.handleRightClick, false);
        container.addEventListener("mousedown", _this.handleDown, false);
        container.addEventListener("wheel", _this.handleWheel, false);
        container.addEventListener("mouseout", _this.handleOut, false);
        document.addEventListener("mousemove", _this.handleMove, false);
        document.addEventListener("mouseup", _this.handleUp, false);
        return _this;
    }
    MouseCaptor.prototype.kill = function () {
        var container = this.container;
        container.removeEventListener("click", this.handleClick);
        container.removeEventListener("contextmenu", this.handleRightClick);
        container.removeEventListener("mousedown", this.handleDown);
        container.removeEventListener("wheel", this.handleWheel);
        container.removeEventListener("mouseout", this.handleOut);
        document.removeEventListener("mousemove", this.handleMove);
        document.removeEventListener("mouseup", this.handleUp);
    };
    MouseCaptor.prototype.handleClick = function (e) {
        var _this = this;
        if (!this.enabled)
            return;
        this.clicks++;
        if (this.clicks === 2) {
            this.clicks = 0;
            if (typeof this.doubleClickTimeout === "number") {
                clearTimeout(this.doubleClickTimeout);
                this.doubleClickTimeout = null;
            }
            return this.handleDoubleClick(e);
        }
        setTimeout(function () {
            _this.clicks = 0;
            _this.doubleClickTimeout = null;
        }, DOUBLE_CLICK_TIMEOUT);
        // NOTE: this is here to prevent click events on drag
        if (this.draggedEvents < DRAGGED_EVENTS_TOLERANCE)
            this.emit("click", (0, captor_1.getMouseCoords)(e, this.container));
    };
    MouseCaptor.prototype.handleRightClick = function (e) {
        if (!this.enabled)
            return;
        this.emit("rightClick", (0, captor_1.getMouseCoords)(e, this.container));
    };
    MouseCaptor.prototype.handleDoubleClick = function (e) {
        if (!this.enabled)
            return;
        e.preventDefault();
        e.stopPropagation();
        var mouseCoords = (0, captor_1.getMouseCoords)(e, this.container);
        this.emit("doubleClick", mouseCoords);
        if (mouseCoords.sigmaDefaultPrevented)
            return;
        // default behavior
        var camera = this.renderer.getCamera();
        var newRatio = camera.getBoundedRatio(camera.getState().ratio / DOUBLE_CLICK_ZOOMING_RATIO);
        camera.animate(this.renderer.getViewportZoomedState((0, captor_1.getPosition)(e, this.container), newRatio), {
            easing: "quadraticInOut",
            duration: DOUBLE_CLICK_ZOOMING_DURATION,
        });
    };
    MouseCaptor.prototype.handleDown = function (e) {
        if (!this.enabled)
            return;
        // We only start dragging on left button
        if (e.button === 0) {
            this.startCameraState = this.renderer.getCamera().getState();
            var _a = (0, captor_1.getPosition)(e, this.container), x = _a.x, y = _a.y;
            this.lastMouseX = x;
            this.lastMouseY = y;
            this.draggedEvents = 0;
            this.downStartTime = Date.now();
            this.isMouseDown = true;
        }
        this.emit("mousedown", (0, captor_1.getMouseCoords)(e, this.container));
    };
    MouseCaptor.prototype.handleUp = function (e) {
        var _this = this;
        if (!this.enabled || !this.isMouseDown)
            return;
        var camera = this.renderer.getCamera();
        this.isMouseDown = false;
        if (typeof this.movingTimeout === "number") {
            clearTimeout(this.movingTimeout);
            this.movingTimeout = null;
        }
        var _a = (0, captor_1.getPosition)(e, this.container), x = _a.x, y = _a.y;
        var cameraState = camera.getState(), previousCameraState = camera.getPreviousState() || { x: 0, y: 0 };
        if (this.isMoving) {
            camera.animate({
                x: cameraState.x + MOUSE_INERTIA_RATIO * (cameraState.x - previousCameraState.x),
                y: cameraState.y + MOUSE_INERTIA_RATIO * (cameraState.y - previousCameraState.y),
            }, {
                duration: MOUSE_INERTIA_DURATION,
                easing: "quadraticOut",
            });
        }
        else if (this.lastMouseX !== x || this.lastMouseY !== y) {
            camera.setState({
                x: cameraState.x,
                y: cameraState.y,
            });
        }
        this.isMoving = false;
        setTimeout(function () {
            var shouldRefresh = _this.draggedEvents > 0;
            _this.draggedEvents = 0;
            // NOTE: this refresh is here to make sure `hideEdgesOnMove` can work
            // when someone releases camera pan drag after having stopped moving.
            // See commit: https://github.com/jacomyal/sigma.js/commit/cfd9197f70319109db6b675dd7c82be493ca95a2
            // See also issue: https://github.com/jacomyal/sigma.js/issues/1290
            // It could be possible to render instead of scheduling a refresh but for
            // now it seems good enough.
            if (shouldRefresh)
                _this.renderer.refresh();
        }, 0);
        this.emit("mouseup", (0, captor_1.getMouseCoords)(e, this.container));
    };
    MouseCaptor.prototype.handleMove = function (e) {
        var _this = this;
        if (!this.enabled)
            return;
        var mouseCoords = (0, captor_1.getMouseCoords)(e, this.container);
        // Always trigger a "mousemovebody" event, so that it is possible to develop
        // a drag-and-drop effect that works even when the mouse is out of the
        // container:
        this.emit("mousemovebody", mouseCoords);
        // Only trigger the "mousemove" event when the mouse is actually hovering
        // the container, to avoid weirdly hovering nodes and/or edges when the
        // mouse is not hover the container:
        if (e.target === this.container) {
            this.emit("mousemove", mouseCoords);
        }
        if (mouseCoords.sigmaDefaultPrevented)
            return;
        // Handle the case when "isMouseDown" all the time, to allow dragging the
        // stage while the mouse is not hover the container:
        if (this.isMouseDown) {
            this.isMoving = true;
            this.draggedEvents++;
            if (typeof this.movingTimeout === "number") {
                clearTimeout(this.movingTimeout);
            }
            this.movingTimeout = window.setTimeout(function () {
                _this.movingTimeout = null;
                _this.isMoving = false;
            }, DRAG_TIMEOUT);
            var camera = this.renderer.getCamera();
            var _a = (0, captor_1.getPosition)(e, this.container), eX = _a.x, eY = _a.y;
            var lastMouse = this.renderer.viewportToFramedGraph({
                x: this.lastMouseX,
                y: this.lastMouseY,
            });
            var mouse = this.renderer.viewportToFramedGraph({ x: eX, y: eY });
            var offsetX = lastMouse.x - mouse.x, offsetY = lastMouse.y - mouse.y;
            var cameraState = camera.getState();
            var x = cameraState.x + offsetX, y = cameraState.y + offsetY;
            camera.setState({ x: x, y: y });
            this.lastMouseX = eX;
            this.lastMouseY = eY;
            e.preventDefault();
            e.stopPropagation();
        }
    };
    MouseCaptor.prototype.handleWheel = function (e) {
        var _this = this;
        if (!this.enabled)
            return;
        e.preventDefault();
        e.stopPropagation();
        var delta = (0, captor_1.getWheelDelta)(e);
        if (!delta)
            return;
        var wheelCoords = (0, captor_1.getWheelCoords)(e, this.container);
        this.emit("wheel", wheelCoords);
        if (wheelCoords.sigmaDefaultPrevented)
            return;
        // Default behavior
        var ratioDiff = delta > 0 ? 1 / ZOOMING_RATIO : ZOOMING_RATIO;
        var camera = this.renderer.getCamera();
        var newRatio = camera.getBoundedRatio(camera.getState().ratio * ratioDiff);
        var wheelDirection = delta > 0 ? 1 : -1;
        var now = Date.now();
        // Cancel events that are too close too each other and in the same direction:
        if (this.currentWheelDirection === wheelDirection &&
            this.lastWheelTriggerTime &&
            now - this.lastWheelTriggerTime < MOUSE_ZOOM_DURATION / 5) {
            return;
        }
        camera.animate(this.renderer.getViewportZoomedState((0, captor_1.getPosition)(e, this.container), newRatio), {
            easing: "quadraticOut",
            duration: MOUSE_ZOOM_DURATION,
        }, function () {
            _this.currentWheelDirection = 0;
        });
        this.currentWheelDirection = wheelDirection;
        this.lastWheelTriggerTime = now;
    };
    MouseCaptor.prototype.handleOut = function () {
        // TODO: dispatch event
    };
    return MouseCaptor;
}(captor_1.default));
exports["default"] = MouseCaptor;


/***/ }),

/***/ "./node_modules/sigma/core/captors/touch.js":
/*!**************************************************!*\
  !*** ./node_modules/sigma/core/captors/touch.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var captor_1 = __importStar(__webpack_require__(/*! ./captor */ "./node_modules/sigma/core/captors/captor.js"));
var DRAG_TIMEOUT = 200;
var TOUCH_INERTIA_RATIO = 3;
var TOUCH_INERTIA_DURATION = 200;
/**
 * Touch captor class.
 *
 * @constructor
 */
var TouchCaptor = /** @class */ (function (_super) {
    __extends(TouchCaptor, _super);
    function TouchCaptor(container, renderer) {
        var _this = _super.call(this, container, renderer) || this;
        _this.enabled = true;
        _this.isMoving = false;
        _this.hasMoved = false;
        _this.touchMode = 0; // number of touches down
        _this.startTouchesPositions = [];
        // Binding methods:
        _this.handleStart = _this.handleStart.bind(_this);
        _this.handleLeave = _this.handleLeave.bind(_this);
        _this.handleMove = _this.handleMove.bind(_this);
        // Binding events
        container.addEventListener("touchstart", _this.handleStart, false);
        container.addEventListener("touchend", _this.handleLeave, false);
        container.addEventListener("touchcancel", _this.handleLeave, false);
        container.addEventListener("touchmove", _this.handleMove, false);
        return _this;
    }
    TouchCaptor.prototype.kill = function () {
        var container = this.container;
        container.removeEventListener("touchstart", this.handleStart);
        container.removeEventListener("touchend", this.handleLeave);
        container.removeEventListener("touchcancel", this.handleLeave);
        container.removeEventListener("touchmove", this.handleMove);
    };
    TouchCaptor.prototype.getDimensions = function () {
        return {
            width: this.container.offsetWidth,
            height: this.container.offsetHeight,
        };
    };
    TouchCaptor.prototype.dispatchRelatedMouseEvent = function (type, e, touch, emitter) {
        var mousePosition = touch || e.touches[0];
        var mouseEvent = new MouseEvent(type, {
            clientX: mousePosition.clientX,
            clientY: mousePosition.clientY,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
        });
        mouseEvent.isFakeSigmaMouseEvent = true;
        (emitter || this.container).dispatchEvent(mouseEvent);
    };
    TouchCaptor.prototype.handleStart = function (e) {
        var _this = this;
        if (!this.enabled)
            return;
        // Prevent default to avoid default browser behaviors...
        e.preventDefault();
        // ...but simulate mouse behavior anyway, to get the MouseCaptor working as well:
        if (e.touches.length === 1)
            this.dispatchRelatedMouseEvent("mousedown", e);
        var touches = (0, captor_1.getTouchesArray)(e.touches);
        this.touchMode = touches.length;
        this.startCameraState = this.renderer.getCamera().getState();
        this.startTouchesPositions = touches.map(function (touch) { return (0, captor_1.getPosition)(touch, _this.container); });
        this.lastTouches = touches;
        this.lastTouchesPositions = this.startTouchesPositions;
        // When there are two touches down, let's record distance and angle as well:
        if (this.touchMode === 2) {
            var _a = __read(this.startTouchesPositions, 2), _b = _a[0], x0 = _b.x, y0 = _b.y, _c = _a[1], x1 = _c.x, y1 = _c.y;
            this.startTouchesAngle = Math.atan2(y1 - y0, x1 - x0);
            this.startTouchesDistance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        }
        this.emit("touchdown", (0, captor_1.getTouchCoords)(e, this.container));
    };
    TouchCaptor.prototype.handleLeave = function (e) {
        if (!this.enabled)
            return;
        // Prevent default to avoid default browser behaviors...
        e.preventDefault();
        // ...but simulate mouse behavior anyway, to get the MouseCaptor working as well:
        if (e.touches.length === 0 && this.lastTouches && this.lastTouches.length) {
            this.dispatchRelatedMouseEvent("mouseup", e, this.lastTouches[0], document);
            // ... and only click if no move was made
            if (!this.hasMoved) {
                this.dispatchRelatedMouseEvent("click", e, this.lastTouches[0]);
            }
        }
        if (this.movingTimeout) {
            this.isMoving = false;
            clearTimeout(this.movingTimeout);
        }
        switch (this.touchMode) {
            case 2:
                if (e.touches.length === 1) {
                    this.handleStart(e);
                    e.preventDefault();
                    break;
                }
            /* falls through */
            case 1:
                // TODO
                // Dispatch event
                if (this.isMoving) {
                    var camera = this.renderer.getCamera();
                    var cameraState = camera.getState(), previousCameraState = camera.getPreviousState() || { x: 0, y: 0 };
                    camera.animate({
                        x: cameraState.x + TOUCH_INERTIA_RATIO * (cameraState.x - previousCameraState.x),
                        y: cameraState.y + TOUCH_INERTIA_RATIO * (cameraState.y - previousCameraState.y),
                    }, {
                        duration: TOUCH_INERTIA_DURATION,
                        easing: "quadraticOut",
                    });
                }
                this.hasMoved = false;
                this.isMoving = false;
                this.touchMode = 0;
                break;
        }
        this.emit("touchup", (0, captor_1.getTouchCoords)(e, this.container));
    };
    TouchCaptor.prototype.handleMove = function (e) {
        var _a;
        var _this = this;
        if (!this.enabled)
            return;
        // Prevent default to avoid default browser behaviors...
        e.preventDefault();
        // ...but simulate mouse behavior anyway, to get the MouseCaptor working as well:
        if (e.touches.length === 1)
            this.dispatchRelatedMouseEvent("mousemove", e);
        var touches = (0, captor_1.getTouchesArray)(e.touches);
        var touchesPositions = touches.map(function (touch) { return (0, captor_1.getPosition)(touch, _this.container); });
        this.lastTouches = touches;
        this.lastTouchesPositions = touchesPositions;
        // If a move was initiated at some point and we get back to startpoint,
        // we should still consider that we did move (which also happens after a
        // multiple touch when only one touch remains in which case handleStart
        // is recalled within handleLeave).
        // Now, some mobile browsers report zero-distance moves so we also check that
        // one of the touches did actually move from the origin position.
        this.hasMoved || (this.hasMoved = touchesPositions.some(function (position, idx) {
            var startPosition = _this.startTouchesPositions[idx];
            return position.x !== startPosition.x || position.y !== startPosition.y;
        }));
        // If there was no move, do not trigger touch moves behavior
        if (!this.hasMoved) {
            return;
        }
        this.isMoving = true;
        if (this.movingTimeout)
            clearTimeout(this.movingTimeout);
        this.movingTimeout = window.setTimeout(function () {
            _this.isMoving = false;
        }, DRAG_TIMEOUT);
        var camera = this.renderer.getCamera();
        var startCameraState = this.startCameraState;
        switch (this.touchMode) {
            case 1: {
                var _b = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0]), xStart = _b.x, yStart = _b.y;
                var _c = this.renderer.viewportToFramedGraph(touchesPositions[0]), x = _c.x, y = _c.y;
                camera.setState({
                    x: startCameraState.x + xStart - x,
                    y: startCameraState.y + yStart - y,
                });
                break;
            }
            case 2: {
                /**
                 * Here is the thinking here:
                 *
                 * 1. We can find the new angle and ratio, by comparing the vector from "touch one" to "touch two" at the start
                 *    of the d'n'd and now
                 *
                 * 2. We can use `Camera#viewportToGraph` inside formula to retrieve the new camera position, using the graph
                 *    position of a touch at the beginning of the d'n'd (using `startCamera.viewportToGraph`) and the viewport
                 *    position of this same touch now
                 */
                var newCameraState = {};
                var _d = touchesPositions[0], x0 = _d.x, y0 = _d.y;
                var _e = touchesPositions[1], x1 = _e.x, y1 = _e.y;
                var angleDiff = Math.atan2(y1 - y0, x1 - x0) - this.startTouchesAngle;
                var ratioDiff = Math.hypot(y1 - y0, x1 - x0) / this.startTouchesDistance;
                // 1.
                var newRatio = camera.getBoundedRatio(startCameraState.ratio / ratioDiff);
                newCameraState.ratio = newRatio;
                newCameraState.angle = startCameraState.angle + angleDiff;
                // 2.
                var dimensions = this.getDimensions();
                var touchGraphPosition = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0], { cameraState: startCameraState });
                var smallestDimension = Math.min(dimensions.width, dimensions.height);
                var dx = smallestDimension / dimensions.width;
                var dy = smallestDimension / dimensions.height;
                var ratio = newRatio / smallestDimension;
                // Align with center of the graph:
                var x = x0 - smallestDimension / 2 / dx;
                var y = y0 - smallestDimension / 2 / dy;
                // Rotate:
                _a = __read([
                    x * Math.cos(-newCameraState.angle) - y * Math.sin(-newCameraState.angle),
                    y * Math.cos(-newCameraState.angle) + x * Math.sin(-newCameraState.angle),
                ], 2), x = _a[0], y = _a[1];
                newCameraState.x = touchGraphPosition.x - x * ratio;
                newCameraState.y = touchGraphPosition.y + y * ratio;
                camera.setState(newCameraState);
                break;
            }
        }
        this.emit("touchmove", (0, captor_1.getTouchCoords)(e, this.container));
    };
    return TouchCaptor;
}(captor_1.default));
exports["default"] = TouchCaptor;


/***/ }),

/***/ "./node_modules/sigma/core/labels.js":
/*!*******************************************!*\
  !*** ./node_modules/sigma/core/labels.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.edgeLabelsToDisplayFromNodes = exports.LabelGrid = void 0;
/**
 * Class representing a single candidate for the label grid selection.
 *
 * It also describes a deterministic way to compare two candidates to assess
 * which one is better.
 */
var LabelCandidate = /** @class */ (function () {
    function LabelCandidate(key, size) {
        this.key = key;
        this.size = size;
    }
    LabelCandidate.compare = function (first, second) {
        // First we compare by size
        if (first.size > second.size)
            return -1;
        if (first.size < second.size)
            return 1;
        // Then since no two nodes can have the same key, we use it to
        // deterministically tie-break by key
        if (first.key > second.key)
            return 1;
        // NOTE: this comparator cannot return 0
        return -1;
    };
    return LabelCandidate;
}());
/**
 * Class representing a 2D spatial grid divided into constant-size cells.
 */
var LabelGrid = /** @class */ (function () {
    function LabelGrid() {
        this.width = 0;
        this.height = 0;
        this.cellSize = 0;
        this.columns = 0;
        this.rows = 0;
        this.cells = {};
    }
    LabelGrid.prototype.resizeAndClear = function (dimensions, cellSize) {
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.cellSize = cellSize;
        this.columns = Math.ceil(dimensions.width / cellSize);
        this.rows = Math.ceil(dimensions.height / cellSize);
        this.cells = {};
    };
    LabelGrid.prototype.getIndex = function (pos) {
        var xIndex = Math.floor(pos.x / this.cellSize);
        var yIndex = Math.floor(pos.y / this.cellSize);
        return yIndex * this.columns + xIndex;
    };
    LabelGrid.prototype.add = function (key, size, pos) {
        var candidate = new LabelCandidate(key, size);
        var index = this.getIndex(pos);
        var cell = this.cells[index];
        if (!cell) {
            cell = [];
            this.cells[index] = cell;
        }
        cell.push(candidate);
    };
    LabelGrid.prototype.organize = function () {
        for (var k in this.cells) {
            var cell = this.cells[k];
            cell.sort(LabelCandidate.compare);
        }
    };
    LabelGrid.prototype.getLabelsToDisplay = function (ratio, density) {
        // TODO: work on visible nodes to optimize? ^ -> threshold outside so that memoization works?
        // TODO: adjust threshold lower, but increase cells a bit?
        // TODO: hunt for geom issue in disguise
        // TODO: memoize while ratio does not move. method to force recompute
        var cellArea = this.cellSize * this.cellSize;
        var scaledCellArea = cellArea / ratio / ratio;
        var scaledDensity = (scaledCellArea * density) / cellArea;
        var labelsToDisplayPerCell = Math.ceil(scaledDensity);
        var labels = [];
        for (var k in this.cells) {
            var cell = this.cells[k];
            for (var i = 0; i < Math.min(labelsToDisplayPerCell, cell.length); i++) {
                labels.push(cell[i].key);
            }
        }
        return labels;
    };
    return LabelGrid;
}());
exports.LabelGrid = LabelGrid;
/**
 * Label heuristic selecting edge labels to display, based on displayed node
 * labels
 *
 * @param  {object} params                 - Parameters:
 * @param  {Set}      displayedNodeLabels  - Currently displayed node labels.
 * @param  {Set}      highlightedNodes     - Highlighted nodes.
 * @param  {Graph}    graph                - The rendered graph.
 * @param  {string}   hoveredNode          - Hovered node (optional)
 * @return {Array}                         - The selected labels.
 */
function edgeLabelsToDisplayFromNodes(params) {
    var graph = params.graph, hoveredNode = params.hoveredNode, highlightedNodes = params.highlightedNodes, displayedNodeLabels = params.displayedNodeLabels;
    var worthyEdges = [];
    // TODO: the code below can be optimized using #.forEach and batching the code per adj
    // We should display an edge's label if:
    //   - Any of its extremities is highlighted or hovered
    //   - Both of its extremities has its label shown
    graph.forEachEdge(function (edge, _, source, target) {
        if (source === hoveredNode ||
            target === hoveredNode ||
            highlightedNodes.has(source) ||
            highlightedNodes.has(target) ||
            (displayedNodeLabels.has(source) && displayedNodeLabels.has(target))) {
            worthyEdges.push(edge);
        }
    });
    return worthyEdges;
}
exports.edgeLabelsToDisplayFromNodes = edgeLabelsToDisplayFromNodes;


/***/ }),

/***/ "./node_modules/sigma/index.js":
/*!*************************************!*\
  !*** ./node_modules/sigma/index.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sigma = exports.MouseCaptor = exports.Camera = void 0;
/**
 * Sigma.js Library Endpoint
 * =========================
 *
 * The library endpoint.
 * @module
 */
var sigma_1 = __importDefault(__webpack_require__(/*! ./sigma */ "./node_modules/sigma/sigma.js"));
exports.Sigma = sigma_1.default;
var camera_1 = __importDefault(__webpack_require__(/*! ./core/camera */ "./node_modules/sigma/core/camera.js"));
exports.Camera = camera_1.default;
var mouse_1 = __importDefault(__webpack_require__(/*! ./core/captors/mouse */ "./node_modules/sigma/core/captors/mouse.js"));
exports.MouseCaptor = mouse_1.default;
exports["default"] = sigma_1.default;


/***/ }),

/***/ "./node_modules/sigma/rendering/edge-labels.js":
/*!*****************************************************!*\
  !*** ./node_modules/sigma/rendering/edge-labels.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.drawStraightEdgeLabel = void 0;
function drawStraightEdgeLabel(context, edgeData, sourceData, targetData, settings) {
    var size = settings.edgeLabelSize, font = settings.edgeLabelFont, weight = settings.edgeLabelWeight, color = settings.edgeLabelColor.attribute
        ? edgeData[settings.edgeLabelColor.attribute] || settings.edgeLabelColor.color || "#000"
        : settings.edgeLabelColor.color;
    var label = edgeData.label;
    if (!label)
        return;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    // Computing positions without considering nodes sizes:
    var sSize = sourceData.size;
    var tSize = targetData.size;
    var sx = sourceData.x;
    var sy = sourceData.y;
    var tx = targetData.x;
    var ty = targetData.y;
    var cx = (sx + tx) / 2;
    var cy = (sy + ty) / 2;
    var dx = tx - sx;
    var dy = ty - sy;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < sSize + tSize)
        return;
    // Adding nodes sizes:
    sx += (dx * sSize) / d;
    sy += (dy * sSize) / d;
    tx -= (dx * tSize) / d;
    ty -= (dy * tSize) / d;
    cx = (sx + tx) / 2;
    cy = (sy + ty) / 2;
    dx = tx - sx;
    dy = ty - sy;
    d = Math.sqrt(dx * dx + dy * dy);
    // Handling ellipsis
    var textLength = context.measureText(label).width;
    if (textLength > d) {
        var ellipsis = "…";
        label = label + ellipsis;
        textLength = context.measureText(label).width;
        while (textLength > d && label.length > 1) {
            label = label.slice(0, -2) + ellipsis;
            textLength = context.measureText(label).width;
        }
        if (label.length < 4)
            return;
    }
    var angle;
    if (dx > 0) {
        if (dy > 0)
            angle = Math.acos(dx / d);
        else
            angle = Math.asin(dy / d);
    }
    else {
        if (dy > 0)
            angle = Math.acos(dx / d) + Math.PI;
        else
            angle = Math.asin(dx / d) + Math.PI / 2;
    }
    context.save();
    context.translate(cx, cy);
    context.rotate(angle);
    context.fillText(label, -textLength / 2, edgeData.size / 2 + size);
    context.restore();
}
exports.drawStraightEdgeLabel = drawStraightEdgeLabel;


/***/ }),

/***/ "./node_modules/sigma/rendering/edge.js":
/*!**********************************************!*\
  !*** ./node_modules/sigma/rendering/edge.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createEdgeCompoundProgram = exports.EdgeProgram = exports.AbstractEdgeProgram = void 0;
var program_1 = __webpack_require__(/*! ./program */ "./node_modules/sigma/rendering/program.js");
var utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/sigma/utils/index.js");
var AbstractEdgeProgram = /** @class */ (function (_super) {
    __extends(AbstractEdgeProgram, _super);
    function AbstractEdgeProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AbstractEdgeProgram;
}(program_1.AbstractProgram));
exports.AbstractEdgeProgram = AbstractEdgeProgram;
var EdgeProgram = /** @class */ (function (_super) {
    __extends(EdgeProgram, _super);
    function EdgeProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EdgeProgram.prototype.process = function (edgeIndex, offset, sourceData, targetData, data) {
        var i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (data.hidden || sourceData.hidden || targetData.hidden) {
            for (var l = i + this.STRIDE; i < l; i++) {
                this.array[i] = 0;
            }
            return;
        }
        return this.processVisibleItem((0, utils_1.indexToColor)(edgeIndex), i, sourceData, targetData, data);
    };
    EdgeProgram.drawLabel = undefined;
    return EdgeProgram;
}(program_1.Program));
exports.EdgeProgram = EdgeProgram;
var EdgeImageClass = /** @class */ (function () {
    function EdgeImageClass(_gl, _pickingBuffer, _renderer) {
        return this;
    }
    EdgeImageClass.prototype.reallocate = function (_capacity) {
        return undefined;
    };
    EdgeImageClass.prototype.process = function (_edgeIndex, _offset, _sourceData, _targetData, _data) {
        return undefined;
    };
    EdgeImageClass.prototype.render = function (_params) {
        return undefined;
    };
    EdgeImageClass.drawLabel = undefined;
    return EdgeImageClass;
}());
/**
 * Helper function combining two or more programs into a single compound one.
 * Note that this is more a quick & easy way to combine program than a really
 * performant option. More performant programs can be written entirely.
 *
 * @param  {array}    programClasses - Program classes to combine.
 * @param  {function} drawLabel - An optional edge "draw label" function.
 * @return {function}
 */
function createEdgeCompoundProgram(programClasses, drawLabel) {
    var _a;
    return _a = /** @class */ (function () {
            function EdgeCompoundProgram(gl, pickingBuffer, renderer) {
                this.programs = programClasses.map(function (Program) {
                    return new Program(gl, pickingBuffer, renderer);
                });
            }
            EdgeCompoundProgram.prototype.reallocate = function (capacity) {
                this.programs.forEach(function (program) { return program.reallocate(capacity); });
            };
            EdgeCompoundProgram.prototype.process = function (edgeIndex, offset, sourceData, targetData, data) {
                this.programs.forEach(function (program) { return program.process(edgeIndex, offset, sourceData, targetData, data); });
            };
            EdgeCompoundProgram.prototype.render = function (params) {
                this.programs.forEach(function (program) { return program.render(params); });
            };
            return EdgeCompoundProgram;
        }()),
        _a.drawLabel = drawLabel,
        _a;
}
exports.createEdgeCompoundProgram = createEdgeCompoundProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/node-hover.js":
/*!****************************************************!*\
  !*** ./node_modules/sigma/rendering/node-hover.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.drawDiscNodeHover = void 0;
var node_labels_1 = __webpack_require__(/*! ./node-labels */ "./node_modules/sigma/rendering/node-labels.js");
/**
 * Draw an hovered node.
 * - if there is no label => display a shadow on the node
 * - if the label box is bigger than node size => display a label box that contains the node with a shadow
 * - else node with shadow and the label box
 */
function drawDiscNodeHover(context, data, settings) {
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    // Then we draw the label background
    context.fillStyle = "#FFF";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = "#000";
    var PADDING = 2;
    if (typeof data.label === "string") {
        var textWidth = context.measureText(data.label).width, boxWidth = Math.round(textWidth + 5), boxHeight = Math.round(size + 2 * PADDING), radius = Math.max(data.size, size / 2) + PADDING;
        var angleRadian = Math.asin(boxHeight / 2 / radius);
        var xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));
        context.beginPath();
        context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
        context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
        context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
        context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
        context.closePath();
        context.fill();
    }
    else {
        context.beginPath();
        context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;
    // And finally we draw the label
    (0, node_labels_1.drawDiscNodeLabel)(context, data, settings);
}
exports.drawDiscNodeHover = drawDiscNodeHover;


/***/ }),

/***/ "./node_modules/sigma/rendering/node-labels.js":
/*!*****************************************************!*\
  !*** ./node_modules/sigma/rendering/node-labels.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.drawDiscNodeLabel = void 0;
function drawDiscNodeLabel(context, data, settings) {
    if (!data.label)
        return;
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight, color = settings.labelColor.attribute
        ? data[settings.labelColor.attribute] || settings.labelColor.color || "#000"
        : settings.labelColor.color;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
}
exports.drawDiscNodeLabel = drawDiscNodeLabel;


/***/ }),

/***/ "./node_modules/sigma/rendering/node.js":
/*!**********************************************!*\
  !*** ./node_modules/sigma/rendering/node.js ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createNodeCompoundProgram = exports.NodeProgram = exports.AbstractNodeProgram = void 0;
var program_1 = __webpack_require__(/*! ./program */ "./node_modules/sigma/rendering/program.js");
var utils_1 = __webpack_require__(/*! ../utils */ "./node_modules/sigma/utils/index.js");
var AbstractNodeProgram = /** @class */ (function (_super) {
    __extends(AbstractNodeProgram, _super);
    function AbstractNodeProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AbstractNodeProgram;
}(program_1.AbstractProgram));
exports.AbstractNodeProgram = AbstractNodeProgram;
var NodeProgram = /** @class */ (function (_super) {
    __extends(NodeProgram, _super);
    function NodeProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NodeProgram.prototype.process = function (nodeIndex, offset, data) {
        var i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (data.hidden) {
            for (var l = i + this.STRIDE; i < l; i++) {
                this.array[i] = 0;
            }
            return;
        }
        return this.processVisibleItem((0, utils_1.indexToColor)(nodeIndex), i, data);
    };
    NodeProgram.drawLabel = undefined;
    NodeProgram.drawHover = undefined;
    return NodeProgram;
}(program_1.Program));
exports.NodeProgram = NodeProgram;
var NodeImageClass = /** @class */ (function () {
    function NodeImageClass(_gl, _pickingBuffer, _renderer) {
        return this;
    }
    NodeImageClass.prototype.reallocate = function (_capacity) {
        return undefined;
    };
    NodeImageClass.prototype.process = function (_nodeIndex, _offset, _data) {
        return undefined;
    };
    NodeImageClass.prototype.render = function (_params) {
        return undefined;
    };
    NodeImageClass.drawLabel = undefined;
    NodeImageClass.drawHover = undefined;
    return NodeImageClass;
}());
/**
 * Helper function combining two or more programs into a single compound one.
 * Note that this is more a quick & easy way to combine program than a really
 * performant option. More performant programs can be written entirely.
 *
 * @param  {array}    programClasses - Program classes to combine.
 * @param  {function} drawLabel - An optional node "draw label" function.
 * @param  {function} drawHover - An optional node "draw hover" function.
 * @return {function}
 */
function createNodeCompoundProgram(programClasses, drawLabel, drawHover) {
    var _a;
    return _a = /** @class */ (function () {
            function NodeCompoundProgram(gl, pickingBuffer, renderer) {
                this.programs = programClasses.map(function (Program) {
                    return new Program(gl, pickingBuffer, renderer);
                });
            }
            NodeCompoundProgram.prototype.reallocate = function (capacity) {
                this.programs.forEach(function (program) { return program.reallocate(capacity); });
            };
            NodeCompoundProgram.prototype.process = function (nodeIndex, offset, data) {
                this.programs.forEach(function (program) { return program.process(nodeIndex, offset, data); });
            };
            NodeCompoundProgram.prototype.render = function (params) {
                this.programs.forEach(function (program) { return program.render(params); });
            };
            return NodeCompoundProgram;
        }()),
        _a.drawLabel = drawLabel,
        _a.drawHover = drawHover,
        _a;
}
exports.createNodeCompoundProgram = createNodeCompoundProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/program.js":
/*!*************************************************!*\
  !*** ./node_modules/sigma/rendering/program.js ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Program = exports.AbstractProgram = void 0;
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/sigma/rendering/utils.js");
var PICKING_PREFIX = "#define PICKING_MODE\n";
var SIZE_FACTOR_PER_ATTRIBUTE_TYPE = (_a = {},
    _a[WebGL2RenderingContext.BOOL] = 1,
    _a[WebGL2RenderingContext.BYTE] = 1,
    _a[WebGL2RenderingContext.UNSIGNED_BYTE] = 1,
    _a[WebGL2RenderingContext.SHORT] = 2,
    _a[WebGL2RenderingContext.UNSIGNED_SHORT] = 2,
    _a[WebGL2RenderingContext.INT] = 4,
    _a[WebGL2RenderingContext.UNSIGNED_INT] = 4,
    _a[WebGL2RenderingContext.FLOAT] = 4,
    _a);
function getAttributeItemsCount(attr) {
    return attr.normalized ? 1 : attr.size;
}
function getAttributesItemsCount(attrs) {
    var res = 0;
    attrs.forEach(function (attr) { return (res += getAttributeItemsCount(attr)); });
    return res;
}
var AbstractProgram = /** @class */ (function () {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function AbstractProgram(_gl, _pickGl, _renderer) {
    }
    return AbstractProgram;
}());
exports.AbstractProgram = AbstractProgram;
var Program = /** @class */ (function () {
    function Program(gl, pickingBuffer, renderer) {
        this.array = new Float32Array();
        this.constantArray = new Float32Array();
        this.capacity = 0;
        this.verticesCount = 0;
        // Reading and caching program definition
        var def = this.getDefinition();
        this.VERTICES = def.VERTICES;
        this.VERTEX_SHADER_SOURCE = def.VERTEX_SHADER_SOURCE;
        this.FRAGMENT_SHADER_SOURCE = def.FRAGMENT_SHADER_SOURCE;
        this.UNIFORMS = def.UNIFORMS;
        this.ATTRIBUTES = def.ATTRIBUTES;
        this.METHOD = def.METHOD;
        this.CONSTANT_ATTRIBUTES = "CONSTANT_ATTRIBUTES" in def ? def.CONSTANT_ATTRIBUTES : [];
        this.CONSTANT_DATA = "CONSTANT_DATA" in def ? def.CONSTANT_DATA : [];
        this.isInstanced = "CONSTANT_ATTRIBUTES" in def;
        // Computing stride
        this.ATTRIBUTES_ITEMS_COUNT = getAttributesItemsCount(this.ATTRIBUTES);
        this.STRIDE = this.VERTICES * this.ATTRIBUTES_ITEMS_COUNT;
        // Members
        this.renderer = renderer;
        this.normalProgram = this.getProgramInfo("normal", gl, def.VERTEX_SHADER_SOURCE, def.FRAGMENT_SHADER_SOURCE, null);
        this.pickProgram = pickingBuffer
            ? this.getProgramInfo("pick", gl, PICKING_PREFIX + def.VERTEX_SHADER_SOURCE, PICKING_PREFIX + def.FRAGMENT_SHADER_SOURCE, pickingBuffer)
            : null;
        // For instanced programs:
        if (this.isInstanced) {
            var constantAttributesItemsCount = getAttributesItemsCount(this.CONSTANT_ATTRIBUTES);
            if (this.CONSTANT_DATA.length !== this.VERTICES)
                throw new Error("Program: error while getting constant data (expected ".concat(this.VERTICES, " items, received ").concat(this.CONSTANT_DATA.length, " instead)"));
            this.constantArray = new Float32Array(this.CONSTANT_DATA.length * constantAttributesItemsCount);
            for (var i = 0; i < this.CONSTANT_DATA.length; i++) {
                var vector = this.CONSTANT_DATA[i];
                if (vector.length !== constantAttributesItemsCount)
                    throw new Error("Program: error while getting constant data (one vector has ".concat(vector.length, " items instead of ").concat(constantAttributesItemsCount, ")"));
                for (var j = 0; j < vector.length; j++)
                    this.constantArray[i * constantAttributesItemsCount + j] = vector[j];
            }
            this.STRIDE = this.ATTRIBUTES_ITEMS_COUNT;
        }
    }
    Program.prototype.getProgramInfo = function (name, gl, vertexShaderSource, fragmentShaderSource, frameBuffer) {
        var def = this.getDefinition();
        // WebGL buffers
        var buffer = gl.createBuffer();
        if (buffer === null)
            throw new Error("Program: error while creating the WebGL buffer.");
        // Shaders and program
        var vertexShader = (0, utils_1.loadVertexShader)(gl, vertexShaderSource);
        var fragmentShader = (0, utils_1.loadFragmentShader)(gl, fragmentShaderSource);
        var program = (0, utils_1.loadProgram)(gl, [vertexShader, fragmentShader]);
        // Initializing locations
        var uniformLocations = {};
        def.UNIFORMS.forEach(function (uniformName) {
            var location = gl.getUniformLocation(program, uniformName);
            if (location)
                uniformLocations[uniformName] = location;
        });
        var attributeLocations = {};
        def.ATTRIBUTES.forEach(function (attr) {
            attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
        });
        // For instanced programs:
        var constantBuffer;
        if ("CONSTANT_ATTRIBUTES" in def) {
            def.CONSTANT_ATTRIBUTES.forEach(function (attr) {
                attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
            });
            constantBuffer = gl.createBuffer();
            if (constantBuffer === null)
                throw new Error("Program: error while creating the WebGL constant buffer.");
        }
        return {
            name: name,
            program: program,
            gl: gl,
            frameBuffer: frameBuffer,
            buffer: buffer,
            constantBuffer: constantBuffer || {},
            uniformLocations: uniformLocations,
            attributeLocations: attributeLocations,
            isPicking: name === "pick",
        };
    };
    Program.prototype.bindProgram = function (program) {
        var _this = this;
        var offset = 0;
        var gl = program.gl, buffer = program.buffer;
        if (!this.isInstanced) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            offset = 0;
            this.ATTRIBUTES.forEach(function (attr) { return (offset += _this.bindAttribute(attr, program, offset)); });
            gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        }
        else {
            // Handle constant data (things that remain unchanged for all items):
            gl.bindBuffer(gl.ARRAY_BUFFER, program.constantBuffer);
            offset = 0;
            this.CONSTANT_ATTRIBUTES.forEach(function (attr) { return (offset += _this.bindAttribute(attr, program, offset, false)); });
            gl.bufferData(gl.ARRAY_BUFFER, this.constantArray, gl.STATIC_DRAW);
            // Handle "instance specific" data (things that vary for each item):
            gl.bindBuffer(gl.ARRAY_BUFFER, program.buffer);
            offset = 0;
            this.ATTRIBUTES.forEach(function (attr) { return (offset += _this.bindAttribute(attr, program, offset, true)); });
            gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Program.prototype.unbindProgram = function (program) {
        var _this = this;
        if (!this.isInstanced) {
            this.ATTRIBUTES.forEach(function (attr) { return _this.unbindAttribute(attr, program); });
        }
        else {
            this.CONSTANT_ATTRIBUTES.forEach(function (attr) { return _this.unbindAttribute(attr, program, false); });
            this.ATTRIBUTES.forEach(function (attr) { return _this.unbindAttribute(attr, program, true); });
        }
    };
    Program.prototype.bindAttribute = function (attr, program, offset, setDivisor) {
        var sizeFactor = SIZE_FACTOR_PER_ATTRIBUTE_TYPE[attr.type];
        if (typeof sizeFactor !== "number")
            throw new Error("Program.bind: yet unsupported attribute type \"".concat(attr.type, "\""));
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
            gl.enableVertexAttribArray(location);
            var stride = !this.isInstanced
                ? this.ATTRIBUTES_ITEMS_COUNT * Float32Array.BYTES_PER_ELEMENT
                : (setDivisor ? this.ATTRIBUTES_ITEMS_COUNT : getAttributesItemsCount(this.CONSTANT_ATTRIBUTES)) *
                    Float32Array.BYTES_PER_ELEMENT;
            gl.vertexAttribPointer(location, attr.size, attr.type, attr.normalized || false, stride, offset);
            if (this.isInstanced && setDivisor) {
                if (gl instanceof WebGL2RenderingContext) {
                    gl.vertexAttribDivisor(location, 1);
                }
                else {
                    var ext = gl.getExtension("ANGLE_instanced_arrays");
                    if (ext)
                        ext.vertexAttribDivisorANGLE(location, 1);
                }
            }
        }
        return attr.size * sizeFactor;
    };
    Program.prototype.unbindAttribute = function (attr, program, unsetDivisor) {
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
            gl.disableVertexAttribArray(location);
            if (this.isInstanced && unsetDivisor) {
                if (gl instanceof WebGL2RenderingContext) {
                    gl.vertexAttribDivisor(location, 0);
                }
                else {
                    var ext = gl.getExtension("ANGLE_instanced_arrays");
                    if (ext)
                        ext.vertexAttribDivisorANGLE(location, 0);
                }
            }
        }
    };
    Program.prototype.reallocate = function (capacity) {
        // If desired capacity has not changed we do nothing
        // NOTE: it's possible here to implement more subtle reallocation schemes
        // when the number of rendered items increase or decrease
        if (capacity === this.capacity)
            return;
        this.capacity = capacity;
        this.verticesCount = this.VERTICES * capacity;
        this.array = new Float32Array(!this.isInstanced
            ? this.verticesCount * this.ATTRIBUTES_ITEMS_COUNT
            : this.capacity * this.ATTRIBUTES_ITEMS_COUNT);
    };
    Program.prototype.hasNothingToRender = function () {
        return this.verticesCount === 0;
    };
    Program.prototype.renderProgram = function (params, programInfo) {
        var gl = programInfo.gl, program = programInfo.program;
        // With the current fix for #1397, the alpha blending is enabled for the
        // picking layer:
        gl.enable(gl.BLEND);
        // Original code:
        // if (!isPicking) gl.enable(gl.BLEND);
        // else gl.disable(gl.BLEND);
        gl.useProgram(program);
        this.setUniforms(params, programInfo);
        this.drawWebGL(this.METHOD, programInfo);
    };
    Program.prototype.render = function (params) {
        if (this.hasNothingToRender())
            return;
        if (this.pickProgram) {
            this.pickProgram.gl.viewport(0, 0, (params.width * params.pixelRatio) / params.downSizingRatio, (params.height * params.pixelRatio) / params.downSizingRatio);
            this.bindProgram(this.pickProgram);
            this.renderProgram(__assign(__assign({}, params), { pixelRatio: params.pixelRatio / params.downSizingRatio }), this.pickProgram);
            this.unbindProgram(this.pickProgram);
        }
        this.normalProgram.gl.viewport(0, 0, params.width * params.pixelRatio, params.height * params.pixelRatio);
        this.bindProgram(this.normalProgram);
        this.renderProgram(params, this.normalProgram);
        this.unbindProgram(this.normalProgram);
    };
    Program.prototype.drawWebGL = function (method, _a) {
        var gl = _a.gl, frameBuffer = _a.frameBuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        if (!this.isInstanced) {
            gl.drawArrays(method, 0, this.verticesCount);
        }
        else {
            if (gl instanceof WebGL2RenderingContext) {
                gl.drawArraysInstanced(method, 0, this.VERTICES, this.capacity);
            }
            else {
                var ext = gl.getExtension("ANGLE_instanced_arrays");
                if (ext)
                    ext.drawArraysInstancedANGLE(method, 0, this.VERTICES, this.capacity);
            }
        }
    };
    return Program;
}());
exports.Program = Program;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-arrow-head/frag.glsl.js":
/*!****************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-arrow-head/frag.glsl.js ***!
  \****************************************************************************/
/***/ ((module) => {

(()=>{"use strict";var e={d:(o,r)=>{for(var t in r)e.o(r,t)&&!e.o(o,t)&&Object.defineProperty(o,t,{enumerable:!0,get:r[t]})},o:(e,o)=>Object.prototype.hasOwnProperty.call(e,o),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},o={};e.r(o),e.d(o,{default:()=>r});const r="precision mediump float;\n\nvarying vec4 v_color;\n\nvoid main(void) {\n  gl_FragColor = v_color;\n}\n";module.exports=o})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-arrow-head/index.js":
/*!************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-arrow-head/index.js ***!
  \************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(/*! ../../../utils */ "./node_modules/sigma/utils/index.js");
var edge_1 = __webpack_require__(/*! ../../edge */ "./node_modules/sigma/rendering/edge.js");
var vert_glsl_1 = __importDefault(__webpack_require__(/*! ./vert.glsl.js */ "./node_modules/sigma/rendering/programs/edge-arrow-head/vert.glsl.js"));
var frag_glsl_1 = __importDefault(__webpack_require__(/*! ./frag.glsl.js */ "./node_modules/sigma/rendering/programs/edge-arrow-head/frag.glsl.js"));
var UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE, FLOAT = WebGLRenderingContext.FLOAT;
var UNIFORMS = ["u_matrix", "u_sizeRatio", "u_correctionRatio"];
var EdgeArrowHeadProgram = /** @class */ (function (_super) {
    __extends(EdgeArrowHeadProgram, _super);
    function EdgeArrowHeadProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EdgeArrowHeadProgram.prototype.getDefinition = function () {
        return {
            VERTICES: 3,
            VERTEX_SHADER_SOURCE: vert_glsl_1.default,
            FRAGMENT_SHADER_SOURCE: frag_glsl_1.default,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                { name: "a_radius", size: 1, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
            ],
            CONSTANT_ATTRIBUTES: [{ name: "a_barycentric", size: 3, type: FLOAT }],
            CONSTANT_DATA: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ],
        };
    };
    EdgeArrowHeadProgram.prototype.processVisibleItem = function (edgeIndex, startIndex, sourceData, targetData, data) {
        var thickness = data.size || 1;
        var radius = targetData.size || 1;
        var x1 = sourceData.x;
        var y1 = sourceData.y;
        var x2 = targetData.x;
        var y2 = targetData.y;
        var color = (0, utils_1.floatColor)(data.color);
        // Computing normals
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = dx * dx + dy * dy;
        var n1 = 0;
        var n2 = 0;
        if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
        }
        var array = this.array;
        array[startIndex++] = x2;
        array[startIndex++] = y2;
        array[startIndex++] = -n1;
        array[startIndex++] = -n2;
        array[startIndex++] = radius;
        array[startIndex++] = color;
        array[startIndex++] = edgeIndex;
    };
    EdgeArrowHeadProgram.prototype.setUniforms = function (params, _a) {
        var gl = _a.gl, uniformLocations = _a.uniformLocations;
        var u_matrix = uniformLocations.u_matrix, u_sizeRatio = uniformLocations.u_sizeRatio, u_correctionRatio = uniformLocations.u_correctionRatio;
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
    };
    return EdgeArrowHeadProgram;
}(edge_1.EdgeProgram));
exports["default"] = EdgeArrowHeadProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-arrow-head/vert.glsl.js":
/*!****************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-arrow-head/vert.glsl.js ***!
  \****************************************************************************/
/***/ ((module) => {

(()=>{"use strict";var e={d:(n,o)=>{for(var a in o)e.o(o,a)&&!e.o(n,a)&&Object.defineProperty(n,a,{enumerable:!0,get:o[a]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};e.r(n),e.d(n,{default:()=>o});const o="attribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_radius;\nattribute vec3 a_barycentric;\n\n#ifdef PICKING_MODE\nattribute vec4 a_id;\n#else\nattribute vec4 a_color;\n#endif\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\n\nconst float minThickness = 1.7;\nconst float bias = 255.0 / 254.0;\nconst float arrowHeadWidthLengthRatio = 0.66;\nconst float arrowHeadLengthThicknessRatio = 2.5;\n\nvoid main() {\n  float normalLength = length(a_normal);\n  vec2 unitNormal = a_normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl and\n  // edge.clamped.vert.glsl. Please read it to get better comments on what's\n  // happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * 2.0 * arrowHeadLengthThicknessRatio;\n  float webGLArrowHeadHalfWidth = webGLArrowHeadLength * arrowHeadWidthLengthRatio / 2.0;\n\n  float da = a_barycentric.x;\n  float db = a_barycentric.y;\n  float dc = a_barycentric.z;\n\n  vec2 delta = vec2(\n      da * (webGLNodeRadius * unitNormal.y)\n    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadHalfWidth * unitNormal.x)\n    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadHalfWidth * unitNormal.x),\n\n      da * (-webGLNodeRadius * unitNormal.x)\n    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadHalfWidth * unitNormal.y)\n    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadHalfWidth * unitNormal.y)\n  );\n\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n\n  gl_Position = vec4(position, 0, 1);\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";module.exports=n})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-arrow/index.js":
/*!*******************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-arrow/index.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sigma.js WebGL Renderer Edge Arrow Program
 * ===========================================
 *
 * Compound program rendering edges as an arrow from the source to the target.
 * @module
 */
var edge_1 = __webpack_require__(/*! ../../edge */ "./node_modules/sigma/rendering/edge.js");
var edge_arrow_head_1 = __importDefault(__webpack_require__(/*! ../edge-arrow-head */ "./node_modules/sigma/rendering/programs/edge-arrow-head/index.js"));
var edge_clamped_1 = __importDefault(__webpack_require__(/*! ../edge-clamped */ "./node_modules/sigma/rendering/programs/edge-clamped/index.js"));
var EdgeArrowProgram = (0, edge_1.createEdgeCompoundProgram)([edge_clamped_1.default, edge_arrow_head_1.default]);
exports["default"] = EdgeArrowProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-clamped/index.js":
/*!*********************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-clamped/index.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sigma.js WebGL Renderer Edge Program
 * =====================================
 *
 * Program rendering edges as thick lines but with a twist: the end of edge
 * does not sit in the middle of target node but instead stays by some margin.
 *
 * This is useful when combined with arrows to draw directed edges.
 * @module
 */
var edge_rectangle_1 = __importDefault(__webpack_require__(/*! ../edge-rectangle */ "./node_modules/sigma/rendering/programs/edge-rectangle/index.js"));
var vert_glsl_1 = __importDefault(__webpack_require__(/*! ./vert.glsl.js */ "./node_modules/sigma/rendering/programs/edge-clamped/vert.glsl.js"));
var utils_1 = __webpack_require__(/*! ../../../utils */ "./node_modules/sigma/utils/index.js");
var UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE, FLOAT = WebGLRenderingContext.FLOAT;
var EdgeClampedProgram = /** @class */ (function (_super) {
    __extends(EdgeClampedProgram, _super);
    function EdgeClampedProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EdgeClampedProgram.prototype.getDefinition = function () {
        return __assign(__assign({}, _super.prototype.getDefinition.call(this)), { VERTEX_SHADER_SOURCE: vert_glsl_1.default, ATTRIBUTES: [
                { name: "a_positionStart", size: 2, type: FLOAT },
                { name: "a_positionEnd", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_radius", size: 1, type: FLOAT },
            ], CONSTANT_ATTRIBUTES: [
                // If 0, then position will be a_positionStart
                // If 1, then position will be a_positionEnd
                { name: "a_positionCoef", size: 1, type: FLOAT },
                { name: "a_normalCoef", size: 1, type: FLOAT },
                { name: "a_radiusCoef", size: 1, type: FLOAT },
            ], CONSTANT_DATA: [
                [0, 1, 0],
                [0, -1, 0],
                [1, 1, 1],
                [1, 1, 1],
                [0, -1, 0],
                [1, -1, -1],
            ] });
    };
    EdgeClampedProgram.prototype.processVisibleItem = function (edgeIndex, startIndex, sourceData, targetData, data) {
        var thickness = data.size || 1;
        var x1 = sourceData.x;
        var y1 = sourceData.y;
        var x2 = targetData.x;
        var y2 = targetData.y;
        var color = (0, utils_1.floatColor)(data.color);
        // Computing normals
        var dx = x2 - x1;
        var dy = y2 - y1;
        var radius = targetData.size || 1;
        var len = dx * dx + dy * dy;
        var n1 = 0;
        var n2 = 0;
        if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
        }
        var array = this.array;
        array[startIndex++] = x1;
        array[startIndex++] = y1;
        array[startIndex++] = x2;
        array[startIndex++] = y2;
        array[startIndex++] = n1;
        array[startIndex++] = n2;
        array[startIndex++] = color;
        array[startIndex++] = edgeIndex;
        array[startIndex++] = radius;
    };
    return EdgeClampedProgram;
}(edge_rectangle_1.default));
exports["default"] = EdgeClampedProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-clamped/vert.glsl.js":
/*!*************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-clamped/vert.glsl.js ***!
  \*************************************************************************/
/***/ ((module) => {

(()=>{"use strict";var o={d:(e,n)=>{for(var t in n)o.o(n,t)&&!o.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})},o:(o,e)=>Object.prototype.hasOwnProperty.call(o,e),r:o=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(o,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(o,"__esModule",{value:!0})}},e={};o.r(e),o.d(e,{default:()=>n});const n="attribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\nattribute float a_radius;\nattribute float a_radiusCoef;\n\nuniform mat3 u_matrix;\nuniform float u_zoomRatio;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\n\nconst float minThickness = 1.7;\nconst float bias = 255.0 / 254.0;\nconst float arrowHeadLengthThicknessRatio = 2.5;\n\nvoid main() {\n  float radius = a_radius * a_radiusCoef;\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl. Please read it to\n  // get better comments on what's happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here, we move the point to leave space for the arrow head:\n  float direction = sign(radius);\n  float webGLNodeRadius = direction * radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * 2.0 * arrowHeadLengthThicknessRatio;\n\n  vec2 compensationVector = vec2(-direction * unitNormal.y, direction * unitNormal.x) * (webGLNodeRadius + webGLArrowHeadLength);\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness + compensationVector, 1)).xy, 0, 1);\n\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";module.exports=e})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-rectangle/frag.glsl.js":
/*!***************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-rectangle/frag.glsl.js ***!
  \***************************************************************************/
/***/ ((module) => {

(()=>{"use strict";var n={d:(e,o)=>{for(var t in o)n.o(o,t)&&!n.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:o[t]})},o:(n,e)=>Object.prototype.hasOwnProperty.call(n,e),r:n=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})}},e={};n.r(e),n.d(e,{default:()=>o});const o="precision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\n\nconst float feather = 0.001;\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  // We only handle antialiasing for normal mode:\n  #ifdef PICKING_MODE\n  gl_FragColor = v_color;\n  #else\n  float dist = length(v_normal) * v_thickness;\n\n  float t = smoothstep(\n    v_thickness - feather,\n    v_thickness,\n    dist\n  );\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n";module.exports=e})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-rectangle/index.js":
/*!***********************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-rectangle/index.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(/*! ../../../utils */ "./node_modules/sigma/utils/index.js");
var edge_1 = __webpack_require__(/*! ../../edge */ "./node_modules/sigma/rendering/edge.js");
var vert_glsl_1 = __importDefault(__webpack_require__(/*! ./vert.glsl.js */ "./node_modules/sigma/rendering/programs/edge-rectangle/vert.glsl.js"));
var frag_glsl_1 = __importDefault(__webpack_require__(/*! ./frag.glsl.js */ "./node_modules/sigma/rendering/programs/edge-rectangle/frag.glsl.js"));
var UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE, FLOAT = WebGLRenderingContext.FLOAT;
var UNIFORMS = ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio"];
var EdgeRectangleProgram = /** @class */ (function (_super) {
    __extends(EdgeRectangleProgram, _super);
    function EdgeRectangleProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EdgeRectangleProgram.prototype.getDefinition = function () {
        return {
            VERTICES: 6,
            VERTEX_SHADER_SOURCE: vert_glsl_1.default,
            FRAGMENT_SHADER_SOURCE: frag_glsl_1.default,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS,
            ATTRIBUTES: [
                { name: "a_positionStart", size: 2, type: FLOAT },
                { name: "a_positionEnd", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
            ],
            CONSTANT_ATTRIBUTES: [
                // If 0, then position will be a_positionStart
                // If 2, then position will be a_positionEnd
                { name: "a_positionCoef", size: 1, type: FLOAT },
                { name: "a_normalCoef", size: 1, type: FLOAT },
            ],
            CONSTANT_DATA: [
                [0, 1],
                [0, -1],
                [1, 1],
                [1, 1],
                [0, -1],
                [1, -1],
            ],
        };
    };
    EdgeRectangleProgram.prototype.processVisibleItem = function (edgeIndex, startIndex, sourceData, targetData, data) {
        var thickness = data.size || 1;
        var x1 = sourceData.x;
        var y1 = sourceData.y;
        var x2 = targetData.x;
        var y2 = targetData.y;
        var color = (0, utils_1.floatColor)(data.color);
        // Computing normals
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = dx * dx + dy * dy;
        var n1 = 0;
        var n2 = 0;
        if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
        }
        var array = this.array;
        array[startIndex++] = x1;
        array[startIndex++] = y1;
        array[startIndex++] = x2;
        array[startIndex++] = y2;
        array[startIndex++] = n1;
        array[startIndex++] = n2;
        array[startIndex++] = color;
        array[startIndex++] = edgeIndex;
    };
    EdgeRectangleProgram.prototype.setUniforms = function (params, _a) {
        var gl = _a.gl, uniformLocations = _a.uniformLocations;
        var u_matrix = uniformLocations.u_matrix, u_zoomRatio = uniformLocations.u_zoomRatio, u_correctionRatio = uniformLocations.u_correctionRatio, u_sizeRatio = uniformLocations.u_sizeRatio;
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
        gl.uniform1f(u_zoomRatio, params.zoomRatio);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
    };
    return EdgeRectangleProgram;
}(edge_1.EdgeProgram));
exports["default"] = EdgeRectangleProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/edge-rectangle/vert.glsl.js":
/*!***************************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/edge-rectangle/vert.glsl.js ***!
  \***************************************************************************/
/***/ ((module) => {

(()=>{"use strict";var e={d:(n,o)=>{for(var t in o)e.o(o,t)&&!e.o(n,t)&&Object.defineProperty(n,t,{enumerable:!0,get:o[t]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};e.r(n),e.d(n,{default:()=>o});const o='attribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_zoomRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\n\nconst float minThickness = 1.7;\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // We require edges to be at least `minThickness` pixels thick *on screen*\n  // (so we need to compensate the size ratio):\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n\n  // Then, we need to retrieve the normalized thickness of the edge in the WebGL\n  // referential (in a ([0, 1], [0, 1]) space), using our "magic" correction\n  // ratio:\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness, 1)).xy, 0, 1);\n\n  // For the fragment shader though, we need a thickness that takes the "magic"\n  // correction ratio into account (as in webGLThickness), but so that the\n  // antialiasing effect does not depend on the zoom level. So here\'s yet\n  // another thickness version:\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n';module.exports=n})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/node-point/frag.glsl.js":
/*!***********************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/node-point/frag.glsl.js ***!
  \***********************************************************************/
/***/ ((module) => {

(()=>{"use strict";var n={d:(e,o)=>{for(var r in o)n.o(o,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:o[r]})},o:(n,e)=>Object.prototype.hasOwnProperty.call(n,e),r:n=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})}},e={};n.r(e),n.d(e,{default:()=>o});const o="precision mediump float;\n\nvarying vec4 v_color;\nvarying float v_border;\n\nconst float radius = 0.5;\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  vec2 m = gl_PointCoord - vec2(0.5, 0.5);\n  float dist = radius - length(m);\n\n  // No antialiasing for picking mode:\n  #ifdef PICKING_MODE\n  if (dist > v_border)\n    gl_FragColor = v_color;\n  else\n    gl_FragColor = transparent;\n\n  #else\n  float t = 0.0;\n  if (dist > v_border)\n    t = 1.0;\n  else if (dist > 0.0)\n    t = dist / v_border;\n\n  gl_FragColor = mix(transparent, v_color, t);\n  #endif\n}\n";module.exports=e})();

/***/ }),

/***/ "./node_modules/sigma/rendering/programs/node-point/index.js":
/*!*******************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/node-point/index.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(/*! ../../../utils */ "./node_modules/sigma/utils/index.js");
var node_1 = __webpack_require__(/*! ../../node */ "./node_modules/sigma/rendering/node.js");
var vert_glsl_1 = __importDefault(__webpack_require__(/*! ./vert.glsl.js */ "./node_modules/sigma/rendering/programs/node-point/vert.glsl.js"));
var frag_glsl_1 = __importDefault(__webpack_require__(/*! ./frag.glsl.js */ "./node_modules/sigma/rendering/programs/node-point/frag.glsl.js"));
var UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE, FLOAT = WebGLRenderingContext.FLOAT;
var UNIFORMS = ["u_sizeRatio", "u_pixelRatio", "u_matrix"];
var NodePointProgram = /** @class */ (function (_super) {
    __extends(NodePointProgram, _super);
    function NodePointProgram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NodePointProgram.prototype.getDefinition = function () {
        return {
            VERTICES: 1,
            VERTEX_SHADER_SOURCE: vert_glsl_1.default,
            FRAGMENT_SHADER_SOURCE: frag_glsl_1.default,
            METHOD: WebGLRenderingContext.POINTS,
            UNIFORMS: UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_size", size: 1, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                { name: "a_id", size: 4, type: UNSIGNED_BYTE, normalized: true },
            ],
        };
    };
    NodePointProgram.prototype.processVisibleItem = function (nodeIndex, startIndex, data) {
        var array = this.array;
        array[startIndex++] = data.x;
        array[startIndex++] = data.y;
        array[startIndex++] = data.size;
        array[startIndex++] = (0, utils_1.floatColor)(data.color);
        array[startIndex++] = nodeIndex;
    };
    NodePointProgram.prototype.setUniforms = function (_a, _b) {
        var sizeRatio = _a.sizeRatio, pixelRatio = _a.pixelRatio, matrix = _a.matrix;
        var gl = _b.gl, uniformLocations = _b.uniformLocations;
        var u_sizeRatio = uniformLocations.u_sizeRatio, u_pixelRatio = uniformLocations.u_pixelRatio, u_matrix = uniformLocations.u_matrix;
        gl.uniform1f(u_pixelRatio, pixelRatio);
        gl.uniform1f(u_sizeRatio, sizeRatio);
        gl.uniformMatrix3fv(u_matrix, false, matrix);
    };
    return NodePointProgram;
}(node_1.NodeProgram));
exports["default"] = NodePointProgram;


/***/ }),

/***/ "./node_modules/sigma/rendering/programs/node-point/vert.glsl.js":
/*!***********************************************************************!*\
  !*** ./node_modules/sigma/rendering/programs/node-point/vert.glsl.js ***!
  \***********************************************************************/
/***/ ((module) => {

(()=>{"use strict";var e={d:(o,n)=>{for(var t in n)e.o(n,t)&&!e.o(o,t)&&Object.defineProperty(o,t,{enumerable:!0,get:n[t]})},o:(e,o)=>Object.prototype.hasOwnProperty.call(e,o),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},o={};e.r(o),e.d(o,{default:()=>n});const n="attribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\n\nuniform float u_sizeRatio;\nuniform float u_pixelRatio;\nuniform mat3 u_matrix;\n\nvarying vec4 v_color;\nvarying float v_border;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  gl_Position = vec4(\n    (u_matrix * vec3(a_position, 1)).xy,\n    0,\n    1\n  );\n\n  // Multiply the point size twice:\n  //  - x SCALING_RATIO to correct the canvas scaling\n  //  - x 2 to correct the formulae\n  gl_PointSize = a_size / u_sizeRatio * u_pixelRatio * 2.0;\n\n  v_border = (0.5 / a_size) * u_sizeRatio;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n";module.exports=o})();

/***/ }),

/***/ "./node_modules/sigma/rendering/utils.js":
/*!***********************************************!*\
  !*** ./node_modules/sigma/rendering/utils.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * Sigma.js Shader Utils
 * ======================
 *
 * Code used to load sigma's shaders.
 * @module
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadProgram = exports.loadFragmentShader = exports.loadVertexShader = void 0;
/**
 * Function used to load a shader.
 */
function loadShader(type, gl, source) {
    var glType = type === "VERTEX" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    // Creating the shader
    var shader = gl.createShader(glType);
    if (shader === null) {
        throw new Error("loadShader: error while creating the shader");
    }
    // Loading source
    gl.shaderSource(shader, source);
    // Compiling the shader
    gl.compileShader(shader);
    // Retrieving compilation status
    var successfullyCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    // Throwing if something went awry
    if (!successfullyCompiled) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("loadShader: error while compiling the shader:\n".concat(infoLog, "\n").concat(source));
    }
    return shader;
}
function loadVertexShader(gl, source) {
    return loadShader("VERTEX", gl, source);
}
exports.loadVertexShader = loadVertexShader;
function loadFragmentShader(gl, source) {
    return loadShader("FRAGMENT", gl, source);
}
exports.loadFragmentShader = loadFragmentShader;
/**
 * Function used to load a program.
 */
function loadProgram(gl, shaders) {
    var program = gl.createProgram();
    if (program === null) {
        throw new Error("loadProgram: error while creating the program.");
    }
    var i, l;
    // Attaching the shaders
    for (i = 0, l = shaders.length; i < l; i++)
        gl.attachShader(program, shaders[i]);
    gl.linkProgram(program);
    // Checking status
    var successfullyLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!successfullyLinked) {
        gl.deleteProgram(program);
        throw new Error("loadProgram: error while linking the program.");
    }
    return program;
}
exports.loadProgram = loadProgram;


/***/ }),

/***/ "./node_modules/sigma/settings.js":
/*!****************************************!*\
  !*** ./node_modules/sigma/settings.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveSettings = exports.validateSettings = exports.DEFAULT_EDGE_PROGRAM_CLASSES = exports.DEFAULT_NODE_PROGRAM_CLASSES = exports.DEFAULT_SETTINGS = void 0;
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/sigma/utils/index.js");
var node_point_1 = __importDefault(__webpack_require__(/*! ./rendering/programs/node-point */ "./node_modules/sigma/rendering/programs/node-point/index.js"));
var edge_rectangle_1 = __importDefault(__webpack_require__(/*! ./rendering/programs/edge-rectangle */ "./node_modules/sigma/rendering/programs/edge-rectangle/index.js"));
var edge_arrow_1 = __importDefault(__webpack_require__(/*! ./rendering/programs/edge-arrow */ "./node_modules/sigma/rendering/programs/edge-arrow/index.js"));
var edge_labels_1 = __webpack_require__(/*! ./rendering/edge-labels */ "./node_modules/sigma/rendering/edge-labels.js");
var node_labels_1 = __webpack_require__(/*! ./rendering/node-labels */ "./node_modules/sigma/rendering/node-labels.js");
var node_hover_1 = __webpack_require__(/*! ./rendering/node-hover */ "./node_modules/sigma/rendering/node-hover.js");
exports.DEFAULT_SETTINGS = {
    // Performance
    hideEdgesOnMove: false,
    hideLabelsOnMove: false,
    renderLabels: true,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    // Component rendering
    defaultNodeColor: "#999",
    defaultNodeType: "circle",
    defaultEdgeColor: "#ccc",
    defaultEdgeType: "line",
    labelFont: "Arial",
    labelSize: 14,
    labelWeight: "normal",
    labelColor: { color: "#000" },
    edgeLabelFont: "Arial",
    edgeLabelSize: 14,
    edgeLabelWeight: "normal",
    edgeLabelColor: { attribute: "color" },
    stagePadding: 30,
    zoomToSizeRatioFunction: Math.sqrt,
    itemSizesReference: "screen",
    defaultDrawEdgeLabel: edge_labels_1.drawStraightEdgeLabel,
    defaultDrawNodeLabel: node_labels_1.drawDiscNodeLabel,
    defaultDrawNodeHover: node_hover_1.drawDiscNodeHover,
    // Labels
    labelDensity: 1,
    labelGridCellSize: 100,
    labelRenderedSizeThreshold: 6,
    // Reducers
    nodeReducer: null,
    edgeReducer: null,
    // Features
    zIndex: false,
    minCameraRatio: null,
    maxCameraRatio: null,
    // Lifecycle
    allowInvalidContainer: false,
    // Program classes
    nodeProgramClasses: {},
    nodeHoverProgramClasses: {},
    edgeProgramClasses: {},
};
exports.DEFAULT_NODE_PROGRAM_CLASSES = {
    circle: node_point_1.default,
};
exports.DEFAULT_EDGE_PROGRAM_CLASSES = {
    arrow: edge_arrow_1.default,
    line: edge_rectangle_1.default,
};
function validateSettings(settings) {
    if (typeof settings.labelDensity !== "number" || settings.labelDensity < 0) {
        throw new Error("Settings: invalid `labelDensity`. Expecting a positive number.");
    }
    var minCameraRatio = settings.minCameraRatio, maxCameraRatio = settings.maxCameraRatio;
    if (typeof minCameraRatio === "number" && typeof maxCameraRatio === "number" && maxCameraRatio < minCameraRatio) {
        throw new Error("Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`.");
    }
}
exports.validateSettings = validateSettings;
function resolveSettings(settings) {
    var resolvedSettings = (0, utils_1.assign)({}, exports.DEFAULT_SETTINGS, settings);
    resolvedSettings.nodeProgramClasses = (0, utils_1.assign)({}, exports.DEFAULT_NODE_PROGRAM_CLASSES, resolvedSettings.nodeProgramClasses);
    resolvedSettings.edgeProgramClasses = (0, utils_1.assign)({}, exports.DEFAULT_EDGE_PROGRAM_CLASSES, resolvedSettings.edgeProgramClasses);
    return resolvedSettings;
}
exports.resolveSettings = resolveSettings;


/***/ }),

/***/ "./node_modules/sigma/sigma.js":
/*!*************************************!*\
  !*** ./node_modules/sigma/sigma.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var camera_1 = __importDefault(__webpack_require__(/*! ./core/camera */ "./node_modules/sigma/core/camera.js"));
var mouse_1 = __importDefault(__webpack_require__(/*! ./core/captors/mouse */ "./node_modules/sigma/core/captors/mouse.js"));
var types_1 = __webpack_require__(/*! ./types */ "./node_modules/sigma/types.js");
var utils_1 = __webpack_require__(/*! ./utils */ "./node_modules/sigma/utils/index.js");
var labels_1 = __webpack_require__(/*! ./core/labels */ "./node_modules/sigma/core/labels.js");
var settings_1 = __webpack_require__(/*! ./settings */ "./node_modules/sigma/settings.js");
var touch_1 = __importDefault(__webpack_require__(/*! ./core/captors/touch */ "./node_modules/sigma/core/captors/touch.js"));
var matrices_1 = __webpack_require__(/*! ./utils/matrices */ "./node_modules/sigma/utils/matrices.js");
var array_1 = __webpack_require__(/*! ./utils/array */ "./node_modules/sigma/utils/array.js");
var picking_1 = __webpack_require__(/*! ./utils/picking */ "./node_modules/sigma/utils/picking.js");
/**
 * Constants.
 */
var X_LABEL_MARGIN = 150;
var Y_LABEL_MARGIN = 50;
/**
 * Important functions.
 */
function applyNodeDefaults(settings, key, data) {
    if (!data.hasOwnProperty("x") || !data.hasOwnProperty("y"))
        throw new Error("Sigma: could not find a valid position (x, y) for node \"".concat(key, "\". All your nodes must have a number \"x\" and \"y\". Maybe your forgot to apply a layout or your \"nodeReducer\" is not returning the correct data?"));
    if (!data.color)
        data.color = settings.defaultNodeColor;
    if (!data.label && data.label !== "")
        data.label = null;
    if (data.label !== undefined && data.label !== null)
        data.label = "" + data.label;
    else
        data.label = null;
    if (!data.size)
        data.size = 2;
    if (!data.hasOwnProperty("hidden"))
        data.hidden = false;
    if (!data.hasOwnProperty("highlighted"))
        data.highlighted = false;
    if (!data.hasOwnProperty("forceLabel"))
        data.forceLabel = false;
    if (!data.type || data.type === "")
        data.type = settings.defaultNodeType;
    if (!data.zIndex)
        data.zIndex = 0;
    return data;
}
function applyEdgeDefaults(settings, _key, data) {
    if (!data.color)
        data.color = settings.defaultEdgeColor;
    if (!data.label)
        data.label = "";
    if (!data.size)
        data.size = 0.5;
    if (!data.hasOwnProperty("hidden"))
        data.hidden = false;
    if (!data.hasOwnProperty("forceLabel"))
        data.forceLabel = false;
    if (!data.type || data.type === "")
        data.type = settings.defaultEdgeType;
    if (!data.zIndex)
        data.zIndex = 0;
    return data;
}
/**
 * Main class.
 *
 * @constructor
 * @param {Graph}       graph     - Graph to render.
 * @param {HTMLElement} container - DOM container in which to render.
 * @param {object}      settings  - Optional settings.
 */
var Sigma = /** @class */ (function (_super) {
    __extends(Sigma, _super);
    function Sigma(graph, container, settings) {
        if (settings === void 0) { settings = {}; }
        var _this = _super.call(this) || this;
        _this.elements = {};
        _this.canvasContexts = {};
        _this.webGLContexts = {};
        _this.pickingLayers = new Set();
        _this.textures = {};
        _this.frameBuffers = {};
        _this.activeListeners = {};
        _this.labelGrid = new labels_1.LabelGrid();
        _this.nodeDataCache = {};
        _this.edgeDataCache = {};
        // Indices to keep track of the index of the item inside programs
        _this.nodeProgramIndex = {};
        _this.edgeProgramIndex = {};
        _this.nodesWithForcedLabels = new Set();
        _this.edgesWithForcedLabels = new Set();
        _this.nodeExtent = { x: [0, 1], y: [0, 1] };
        _this.nodeZExtent = [Infinity, -Infinity];
        _this.edgeZExtent = [Infinity, -Infinity];
        _this.matrix = (0, matrices_1.identity)();
        _this.invMatrix = (0, matrices_1.identity)();
        _this.correctionRatio = 1;
        _this.customBBox = null;
        _this.normalizationFunction = (0, utils_1.createNormalizationFunction)({
            x: [0, 1],
            y: [0, 1],
        });
        // Cache:
        _this.graphToViewportRatio = 1;
        _this.itemIDsIndex = {};
        _this.nodeIndices = {};
        _this.edgeIndices = {};
        // Starting dimensions and pixel ratio
        _this.width = 0;
        _this.height = 0;
        _this.pixelRatio = (0, utils_1.getPixelRatio)();
        _this.pickingDownSizingRatio = 2 * _this.pixelRatio;
        // Graph State
        _this.displayedNodeLabels = new Set();
        _this.displayedEdgeLabels = new Set();
        _this.highlightedNodes = new Set();
        _this.hoveredNode = null;
        _this.hoveredEdge = null;
        // Internal states
        _this.renderFrame = null;
        _this.renderHighlightedNodesFrame = null;
        _this.needToProcess = false;
        _this.checkEdgesEventsFrame = null;
        // Programs
        _this.nodePrograms = {};
        _this.nodeHoverPrograms = {};
        _this.edgePrograms = {};
        // Resolving settings
        _this.settings = (0, settings_1.resolveSettings)(settings);
        // Validating
        (0, settings_1.validateSettings)(_this.settings);
        (0, utils_1.validateGraph)(graph);
        if (!(container instanceof HTMLElement))
            throw new Error("Sigma: container should be an html element.");
        // Properties
        _this.graph = graph;
        _this.container = container;
        // Initializing contexts
        _this.createWebGLContext("edges", { picking: settings.enableEdgeEvents });
        _this.createCanvasContext("edgeLabels");
        _this.createWebGLContext("nodes", { picking: true });
        _this.createCanvasContext("labels");
        _this.createCanvasContext("hovers");
        _this.createWebGLContext("hoverNodes");
        _this.createCanvasContext("mouse");
        // Initial resize
        _this.resize();
        // Loading programs
        for (var type in _this.settings.nodeProgramClasses) {
            var NodeProgramClass = _this.settings.nodeProgramClasses[type];
            _this.nodePrograms[type] = new NodeProgramClass(_this.webGLContexts.nodes, _this.frameBuffers.nodes, _this);
            var NodeHoverProgram = NodeProgramClass;
            if (type in _this.settings.nodeHoverProgramClasses) {
                NodeHoverProgram = _this.settings.nodeHoverProgramClasses[type];
            }
            _this.nodeHoverPrograms[type] = new NodeHoverProgram(_this.webGLContexts.hoverNodes, null, _this);
        }
        for (var type in _this.settings.edgeProgramClasses) {
            var EdgeProgramClass = _this.settings.edgeProgramClasses[type];
            _this.edgePrograms[type] = new EdgeProgramClass(_this.webGLContexts.edges, _this.frameBuffers.edges, _this);
        }
        // Initializing the camera
        _this.camera = new camera_1.default();
        // Binding camera events
        _this.bindCameraHandlers();
        // Initializing captors
        _this.mouseCaptor = new mouse_1.default(_this.elements.mouse, _this);
        _this.touchCaptor = new touch_1.default(_this.elements.mouse, _this);
        // Binding event handlers
        _this.bindEventHandlers();
        // Binding graph handlers
        _this.bindGraphHandlers();
        // Trigger eventual settings-related things
        _this.handleSettingsUpdate();
        // Processing data for the first time & render
        _this.refresh();
        return _this;
    }
    /**---------------------------------------------------------------------------
     * Internal methods.
     **---------------------------------------------------------------------------
     */
    /**
     * Internal function used to create a canvas element.
     * @param  {string} id - Context's id.
     * @return {Sigma}
     */
    Sigma.prototype.createCanvas = function (id) {
        var canvas = (0, utils_1.createElement)("canvas", {
            position: "absolute",
        }, {
            class: "sigma-".concat(id),
        });
        this.elements[id] = canvas;
        this.container.appendChild(canvas);
        return canvas;
    };
    /**
     * Internal function used to create a canvas context and add the relevant
     * DOM elements.
     *
     * @param  {string} id - Context's id.
     * @return {Sigma}
     */
    Sigma.prototype.createCanvasContext = function (id) {
        var canvas = this.createCanvas(id);
        var contextOptions = {
            preserveDrawingBuffer: false,
            antialias: false,
        };
        this.canvasContexts[id] = canvas.getContext("2d", contextOptions);
        return this;
    };
    /**
     * Internal function used to create a WebGL context and add the relevant DOM
     * elements.
     *
     * @param  {string}  id      - Context's id.
     * @param  {object?} options - #getContext params to override (optional)
     * @return {Sigma}
     */
    Sigma.prototype.createWebGLContext = function (id, options) {
        var canvas = this.createCanvas(id);
        if (options === null || options === void 0 ? void 0 : options.hidden)
            canvas.remove();
        var contextOptions = __assign({ preserveDrawingBuffer: false, antialias: false }, (options || {}));
        var context;
        // First we try webgl2 for an easy performance boost
        context = canvas.getContext("webgl2", contextOptions);
        // Else we fall back to webgl
        if (!context)
            context = canvas.getContext("webgl", contextOptions);
        // Edge, I am looking right at you...
        if (!context)
            context = canvas.getContext("experimental-webgl", contextOptions);
        var gl = context;
        this.webGLContexts[id] = gl;
        // Blending:
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        // Prepare frame buffer for picking layers:
        if (options === null || options === void 0 ? void 0 : options.picking) {
            this.pickingLayers.add(id);
            var newFrameBuffer = gl.createFramebuffer();
            if (!newFrameBuffer)
                throw new Error("Sigma: cannot create a new frame buffer for layer ".concat(id));
            this.frameBuffers[id] = newFrameBuffer;
        }
        return this;
    };
    /**
     * Method (re)binding WebGL texture (for picking).
     *
     * @return {Sigma}
     */
    Sigma.prototype.resetWebGLTexture = function (id) {
        var gl = this.webGLContexts[id];
        var frameBuffer = this.frameBuffers[id];
        var currentTexture = this.textures[id];
        if (currentTexture)
            gl.deleteTexture(currentTexture);
        var pickingTexture = gl.createTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, pickingTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickingTexture, 0);
        this.textures[id] = pickingTexture;
        return this;
    };
    /**
     * Method binding camera handlers.
     *
     * @return {Sigma}
     */
    Sigma.prototype.bindCameraHandlers = function () {
        var _this = this;
        this.activeListeners.camera = function () {
            _this.scheduleRender();
        };
        this.camera.on("updated", this.activeListeners.camera);
        return this;
    };
    /**
     * Method unbinding camera handlers.
     *
     * @return {Sigma}
     */
    Sigma.prototype.unbindCameraHandlers = function () {
        this.camera.removeListener("updated", this.activeListeners.camera);
        return this;
    };
    /**
     * Method that returns the closest node to a given position.
     */
    Sigma.prototype.getNodeAtPosition = function (position) {
        var x = position.x, y = position.y;
        var color = (0, picking_1.getPixelColor)(this.webGLContexts.nodes, this.frameBuffers.nodes, x, y, this.pixelRatio, this.pickingDownSizingRatio);
        var index = utils_1.colorToIndex.apply(void 0, __spreadArray([], __read(color), false));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "node" ? itemAt.id : null;
    };
    /**
     * Method binding event handlers.
     *
     * @return {Sigma}
     */
    Sigma.prototype.bindEventHandlers = function () {
        var _this = this;
        // Handling window resize
        this.activeListeners.handleResize = function () {
            // need to call a refresh to rebuild the labelgrid
            _this.scheduleRefresh();
        };
        window.addEventListener("resize", this.activeListeners.handleResize);
        // Handling mouse move
        this.activeListeners.handleMove = function (e) {
            var baseEvent = {
                event: e,
                preventSigmaDefault: function () {
                    e.preventSigmaDefault();
                },
            };
            var nodeToHover = _this.getNodeAtPosition(e);
            if (nodeToHover && _this.hoveredNode !== nodeToHover && !_this.nodeDataCache[nodeToHover].hidden) {
                // Handling passing from one node to the other directly
                if (_this.hoveredNode)
                    _this.emit("leaveNode", __assign(__assign({}, baseEvent), { node: _this.hoveredNode }));
                _this.hoveredNode = nodeToHover;
                _this.emit("enterNode", __assign(__assign({}, baseEvent), { node: nodeToHover }));
                _this.scheduleHighlightedNodesRender();
                return;
            }
            // Checking if the hovered node is still hovered
            if (_this.hoveredNode) {
                if (_this.getNodeAtPosition(e) !== _this.hoveredNode) {
                    var node = _this.hoveredNode;
                    _this.hoveredNode = null;
                    _this.emit("leaveNode", __assign(__assign({}, baseEvent), { node: node }));
                    _this.scheduleHighlightedNodesRender();
                    return;
                }
            }
            if (_this.settings.enableEdgeEvents) {
                _this.checkEdgeHoverEvents(baseEvent);
            }
        };
        // Handling click
        var createMouseListener = function (eventType) {
            return function (e) {
                var baseEvent = {
                    event: e,
                    preventSigmaDefault: function () {
                        e.preventSigmaDefault();
                    },
                };
                var isFakeSigmaMouseEvent = e.original.isFakeSigmaMouseEvent;
                var nodeAtPosition = isFakeSigmaMouseEvent ? _this.getNodeAtPosition(e) : _this.hoveredNode;
                if (nodeAtPosition)
                    return _this.emit("".concat(eventType, "Node"), __assign(__assign({}, baseEvent), { node: nodeAtPosition }));
                if (_this.settings.enableEdgeEvents) {
                    var edge = _this.getEdgeAtPoint(e.x, e.y);
                    if (edge)
                        return _this.emit("".concat(eventType, "Edge"), __assign(__assign({}, baseEvent), { edge: edge }));
                }
                return _this.emit("".concat(eventType, "Stage"), baseEvent);
            };
        };
        this.activeListeners.handleClick = createMouseListener("click");
        this.activeListeners.handleRightClick = createMouseListener("rightClick");
        this.activeListeners.handleDoubleClick = createMouseListener("doubleClick");
        this.activeListeners.handleWheel = createMouseListener("wheel");
        this.activeListeners.handleDown = createMouseListener("down");
        this.mouseCaptor.on("mousemove", this.activeListeners.handleMove);
        this.mouseCaptor.on("click", this.activeListeners.handleClick);
        this.mouseCaptor.on("rightClick", this.activeListeners.handleRightClick);
        this.mouseCaptor.on("doubleClick", this.activeListeners.handleDoubleClick);
        this.mouseCaptor.on("wheel", this.activeListeners.handleWheel);
        this.mouseCaptor.on("mousedown", this.activeListeners.handleDown);
        // TODO
        // Deal with Touch captor events
        return this;
    };
    /**
     * Method binding graph handlers
     *
     * @return {Sigma}
     */
    Sigma.prototype.bindGraphHandlers = function () {
        var _this = this;
        var graph = this.graph;
        var LAYOUT_IMPACTING_FIELDS = new Set(["x", "y", "zIndex", "type"]);
        this.activeListeners.eachNodeAttributesUpdatedGraphUpdate = function (e) {
            var _a;
            var updatedFields = (_a = e.hints) === null || _a === void 0 ? void 0 : _a.attributes;
            // we process all nodes
            _this.graph.forEachNode(function (node) { return _this.updateNode(node); });
            // if coord, type or zIndex have changed, we need to schedule a render
            // (zIndex for the programIndex)
            var layoutChanged = !updatedFields || updatedFields.some(function (f) { return LAYOUT_IMPACTING_FIELDS.has(f); });
            _this.refresh({ partialGraph: { nodes: graph.nodes() }, skipIndexation: !layoutChanged, schedule: true });
        };
        this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate = function (e) {
            var _a;
            var updatedFields = (_a = e.hints) === null || _a === void 0 ? void 0 : _a.attributes;
            // we process all edges
            _this.graph.forEachEdge(function (edge) { return _this.updateEdge(edge); });
            var layoutChanged = updatedFields && ["zIndex", "type"].some(function (f) { return updatedFields === null || updatedFields === void 0 ? void 0 : updatedFields.includes(f); });
            _this.refresh({ partialGraph: { edges: graph.edges() }, skipIndexation: !layoutChanged, schedule: true });
        };
        // On add node, we add the node in indices and then call for a render
        this.activeListeners.addNodeGraphUpdate = function (payload) {
            var node = payload.key;
            // we process the node
            _this.addNode(node);
            // schedule a render for the node
            _this.refresh({ partialGraph: { nodes: [node] }, skipIndexation: false, schedule: true });
        };
        // On update node, we update indices and then call for a render
        this.activeListeners.updateNodeGraphUpdate = function (payload) {
            var node = payload.key;
            // schedule a render for the node
            _this.refresh({ partialGraph: { nodes: [node] }, skipIndexation: false, schedule: true });
        };
        // On drop node, we remove the node from indices and then call for a refresh
        this.activeListeners.dropNodeGraphUpdate = function (payload) {
            var node = payload.key;
            // we process the node
            _this.removeNode(node);
            // schedule a render for everything
            _this.refresh({ schedule: true });
        };
        // On add edge, we remove the edge from indices and then call for a refresh
        this.activeListeners.addEdgeGraphUpdate = function (payload) {
            var edge = payload.key;
            // we process the edge
            _this.addEdge(edge);
            // schedule a render for the edge
            _this.refresh({ partialGraph: { edges: [edge] }, schedule: true });
        };
        // On update edge, we update indices and then call for a refresh
        this.activeListeners.updateEdgeGraphUpdate = function (payload) {
            var edge = payload.key;
            // schedule a repaint for the edge
            _this.refresh({ partialGraph: { edges: [edge] }, skipIndexation: false, schedule: true });
        };
        // On drop edge, we remove the edge from indices and then call for a refresh
        this.activeListeners.dropEdgeGraphUpdate = function (payload) {
            var edge = payload.key;
            // we process the edge
            _this.removeEdge(edge);
            // schedule a render for all edges
            _this.refresh({ schedule: true });
        };
        // On clear edges, we clear the edge indices and then call for a refresh
        this.activeListeners.clearEdgesGraphUpdate = function () {
            // we clear the edge data structures
            _this.clearEdgeState();
            _this.clearEdgeIndices();
            // schedule a render for all edges
            _this.refresh({ schedule: true });
        };
        // On graph clear, we clear indices and then call for a refresh
        this.activeListeners.clearGraphUpdate = function () {
            // clear graph state
            _this.clearEdgeState();
            _this.clearNodeState();
            // clear graph indices
            _this.clearEdgeIndices();
            _this.clearNodeIndices();
            // schedule a render for all
            _this.refresh({ schedule: true });
        };
        graph.on("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.on("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.on("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.on("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.on("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.on("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.on("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.on("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.on("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.on("cleared", this.activeListeners.clearGraphUpdate);
        return this;
    };
    /**
     * Method used to unbind handlers from the graph.
     *
     * @return {undefined}
     */
    Sigma.prototype.unbindGraphHandlers = function () {
        var graph = this.graph;
        graph.removeListener("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.removeListener("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.removeListener("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.removeListener("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.removeListener("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.removeListener("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.removeListener("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.removeListener("cleared", this.activeListeners.clearGraphUpdate);
    };
    /**
     * Method dealing with "leaveEdge" and "enterEdge" events.
     *
     * @return {Sigma}
     */
    Sigma.prototype.checkEdgeHoverEvents = function (payload) {
        var edgeToHover = this.hoveredNode ? null : this.getEdgeAtPoint(payload.event.x, payload.event.y);
        if (edgeToHover !== this.hoveredEdge) {
            if (this.hoveredEdge)
                this.emit("leaveEdge", __assign(__assign({}, payload), { edge: this.hoveredEdge }));
            if (edgeToHover)
                this.emit("enterEdge", __assign(__assign({}, payload), { edge: edgeToHover }));
            this.hoveredEdge = edgeToHover;
        }
        return this;
    };
    /**
     * Method looking for an edge colliding with a given point at (x, y). Returns
     * the key of the edge if any, or null else.
     */
    Sigma.prototype.getEdgeAtPoint = function (x, y) {
        var color = (0, picking_1.getPixelColor)(this.webGLContexts.edges, this.frameBuffers.edges, x, y, this.pixelRatio, this.pickingDownSizingRatio);
        var index = utils_1.colorToIndex.apply(void 0, __spreadArray([], __read(color), false));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "edge" ? itemAt.id : null;
    };
    /**
     * Method used to process the whole graph's data.
     *  - extent
     *  - normalizationFunction
     *  - compute node's coordinate
     *  - labelgrid
     *  - program data allocation
     * @return {Sigma}
     */
    Sigma.prototype.process = function () {
        var _this = this;
        var graph = this.graph;
        var settings = this.settings;
        var dimensions = this.getDimensions();
        //
        // NODES
        //
        this.nodeExtent = (0, utils_1.graphExtent)(this.graph);
        this.normalizationFunction = (0, utils_1.createNormalizationFunction)(this.customBBox || this.nodeExtent);
        // NOTE: it is important to compute this matrix after computing the node's extent
        // because #.getGraphDimensions relies on it
        var nullCamera = new camera_1.default();
        var nullCameraMatrix = (0, utils_1.matrixFromCamera)(nullCamera.getState(), dimensions, this.getGraphDimensions(), this.getSetting("stagePadding") || 0);
        // Resetting the label grid
        // TODO: it's probably better to do this explicitly or on resizes for layout and anims
        this.labelGrid.resizeAndClear(dimensions, settings.labelGridCellSize);
        var nodesPerPrograms = {};
        var nodeIndices = {};
        var edgeIndices = {};
        var itemIDsIndex = {};
        var incrID = 1;
        var nodes = graph.nodes();
        // Do some indexation on the whole graph
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            var data = this.nodeDataCache[node];
            // Get initial coordinates
            var attrs = graph.getNodeAttributes(node);
            data.x = attrs.x;
            data.y = attrs.y;
            this.normalizationFunction.applyTo(data);
            // labelgrid
            if (typeof data.label === "string" && !data.hidden)
                this.labelGrid.add(node, data.size, this.framedGraphToViewport(data, { matrix: nullCameraMatrix }));
            // update count per program
            nodesPerPrograms[data.type] = (nodesPerPrograms[data.type] || 0) + 1;
        }
        this.labelGrid.organize();
        // Allocate memory to programs
        for (var type in this.nodePrograms) {
            if (!this.nodePrograms.hasOwnProperty(type)) {
                throw new Error("Sigma: could not find a suitable program for node type \"".concat(type, "\"!"));
            }
            this.nodePrograms[type].reallocate(nodesPerPrograms[type] || 0);
            // We reset that count here, so that we can reuse it while calling the Program#process methods:
            nodesPerPrograms[type] = 0;
        }
        // Order nodes by zIndex before to add them to program
        if (this.settings.zIndex && this.nodeZExtent[0] !== this.nodeZExtent[1])
            nodes = (0, utils_1.zIndexOrdering)(this.nodeZExtent, function (node) { return _this.nodeDataCache[node].zIndex; }, nodes);
        // Add data to programs
        for (var i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            nodeIndices[node] = incrID;
            itemIDsIndex[nodeIndices[node]] = { type: "node", id: node };
            incrID++;
            var data = this.nodeDataCache[node];
            this.addNodeToProgram(node, nodeIndices[node], nodesPerPrograms[data.type]++);
        }
        //
        // EDGES
        //
        var edgesPerPrograms = {};
        var edges = graph.edges();
        // Allocate memory to programs
        for (var i = 0, l = edges.length; i < l; i++) {
            var edge = edges[i];
            var data = this.edgeDataCache[edge];
            edgesPerPrograms[data.type] = (edgesPerPrograms[data.type] || 0) + 1;
        }
        // Order edges by zIndex before to add them to program
        if (this.settings.zIndex && this.edgeZExtent[0] !== this.edgeZExtent[1])
            edges = (0, utils_1.zIndexOrdering)(this.edgeZExtent, function (edge) { return _this.edgeDataCache[edge].zIndex; }, edges);
        for (var type in this.edgePrograms) {
            if (!this.edgePrograms.hasOwnProperty(type)) {
                throw new Error("Sigma: could not find a suitable program for edge type \"".concat(type, "\"!"));
            }
            this.edgePrograms[type].reallocate(edgesPerPrograms[type] || 0);
            // We reset that count here, so that we can reuse it while calling the Program#process methods:
            edgesPerPrograms[type] = 0;
        }
        // Add data to programs
        for (var i = 0, l = edges.length; i < l; i++) {
            var edge = edges[i];
            edgeIndices[edge] = incrID;
            itemIDsIndex[edgeIndices[edge]] = { type: "edge", id: edge };
            incrID++;
            var data = this.edgeDataCache[edge];
            this.addEdgeToProgram(edge, edgeIndices[edge], edgesPerPrograms[data.type]++);
        }
        this.itemIDsIndex = itemIDsIndex;
        this.nodeIndices = nodeIndices;
        this.edgeIndices = edgeIndices;
        return this;
    };
    /**
     * Method that backports potential settings updates where it's needed.
     * @private
     */
    Sigma.prototype.handleSettingsUpdate = function () {
        this.camera.minRatio = this.settings.minCameraRatio;
        this.camera.maxRatio = this.settings.maxCameraRatio;
        this.camera.setState(this.camera.validateState(this.camera.getState()));
        return this;
    };
    /**
     * Method used to render labels.
     *
     * @return {Sigma}
     */
    Sigma.prototype.renderLabels = function () {
        if (!this.settings.renderLabels)
            return this;
        var cameraState = this.camera.getState();
        // Selecting labels to draw
        var labelsToDisplay = this.labelGrid.getLabelsToDisplay(cameraState.ratio, this.settings.labelDensity);
        (0, array_1.extend)(labelsToDisplay, this.nodesWithForcedLabels);
        this.displayedNodeLabels = new Set();
        // Drawing labels
        var context = this.canvasContexts.labels;
        for (var i = 0, l = labelsToDisplay.length; i < l; i++) {
            var node = labelsToDisplay[i];
            var data = this.nodeDataCache[node];
            // If the node was already drawn (like if it is eligible AND has
            // `forceLabel`), we don't want to draw it again
            // NOTE: we can do better probably
            if (this.displayedNodeLabels.has(node))
                continue;
            // If the node is hidden, we don't need to display its label obviously
            if (data.hidden)
                continue;
            var _a = this.framedGraphToViewport(data), x = _a.x, y = _a.y;
            // NOTE: we can cache the labels we need to render until the camera's ratio changes
            var size = this.scaleSize(data.size);
            // Is node big enough?
            if (!data.forceLabel && size < this.settings.labelRenderedSizeThreshold)
                continue;
            // Is node actually on screen (with some margin)
            // NOTE: we used to rely on the quadtree for this, but the coordinates
            // conversion make it unreliable and at that point we already converted
            // to viewport coordinates and since the label grid already culls the
            // number of potential labels to display this looks like a good
            // performance compromise.
            // NOTE: labelGrid.getLabelsToDisplay could probably optimize by not
            // considering cells obviously outside of the range of the current
            // view rectangle.
            if (x < -X_LABEL_MARGIN ||
                x > this.width + X_LABEL_MARGIN ||
                y < -Y_LABEL_MARGIN ||
                y > this.height + Y_LABEL_MARGIN)
                continue;
            // Because displayed edge labels depend directly on actually rendered node
            // labels, we need to only add to this.displayedNodeLabels nodes whose label
            // is rendered.
            // This makes this.displayedNodeLabels depend on viewport, which might become
            // an issue once we start memoizing getLabelsToDisplay.
            this.displayedNodeLabels.add(node);
            var _b = this.settings, nodeProgramClasses = _b.nodeProgramClasses, defaultDrawNodeLabel = _b.defaultDrawNodeLabel;
            var drawLabel = nodeProgramClasses[data.type].drawLabel || defaultDrawNodeLabel;
            drawLabel(context, __assign(__assign({ key: node }, data), { size: size, x: x, y: y }), this.settings);
        }
        return this;
    };
    /**
     * Method used to render edge labels, based on which node labels were
     * rendered.
     *
     * @return {Sigma}
     */
    Sigma.prototype.renderEdgeLabels = function () {
        if (!this.settings.renderEdgeLabels)
            return this;
        var context = this.canvasContexts.edgeLabels;
        // Clearing
        context.clearRect(0, 0, this.width, this.height);
        var edgeLabelsToDisplay = (0, labels_1.edgeLabelsToDisplayFromNodes)({
            graph: this.graph,
            hoveredNode: this.hoveredNode,
            displayedNodeLabels: this.displayedNodeLabels,
            highlightedNodes: this.highlightedNodes,
        });
        (0, array_1.extend)(edgeLabelsToDisplay, this.edgesWithForcedLabels);
        var displayedLabels = new Set();
        for (var i = 0, l = edgeLabelsToDisplay.length; i < l; i++) {
            var edge = edgeLabelsToDisplay[i], extremities = this.graph.extremities(edge), sourceData = this.nodeDataCache[extremities[0]], targetData = this.nodeDataCache[extremities[1]], edgeData = this.edgeDataCache[edge];
            // If the edge was already drawn (like if it is eligible AND has
            // `forceLabel`), we don't want to draw it again
            if (displayedLabels.has(edge))
                continue;
            // If the edge is hidden we don't need to display its label
            // NOTE: the test on sourceData & targetData is probably paranoid at this point?
            if (edgeData.hidden || sourceData.hidden || targetData.hidden) {
                continue;
            }
            var _a = this.settings, edgeProgramClasses = _a.edgeProgramClasses, defaultDrawEdgeLabel = _a.defaultDrawEdgeLabel;
            var drawLabel = edgeProgramClasses[edgeData.type].drawLabel || defaultDrawEdgeLabel;
            drawLabel(context, __assign(__assign({ key: edge }, edgeData), { size: this.scaleSize(edgeData.size) }), __assign(__assign(__assign({ key: extremities[0] }, sourceData), this.framedGraphToViewport(sourceData)), { size: this.scaleSize(sourceData.size) }), __assign(__assign(__assign({ key: extremities[1] }, targetData), this.framedGraphToViewport(targetData)), { size: this.scaleSize(targetData.size) }), this.settings);
            displayedLabels.add(edge);
        }
        this.displayedEdgeLabels = displayedLabels;
        return this;
    };
    /**
     * Method used to render the highlighted nodes.
     *
     * @return {Sigma}
     */
    Sigma.prototype.renderHighlightedNodes = function () {
        var _this = this;
        var context = this.canvasContexts.hovers;
        // Clearing
        context.clearRect(0, 0, this.width, this.height);
        // Rendering
        var render = function (node) {
            var data = _this.nodeDataCache[node];
            var _a = _this.framedGraphToViewport(data), x = _a.x, y = _a.y;
            var size = _this.scaleSize(data.size);
            var _b = _this.settings, nodeProgramClasses = _b.nodeProgramClasses, defaultDrawNodeHover = _b.defaultDrawNodeHover;
            var drawHover = nodeProgramClasses[data.type].drawHover || defaultDrawNodeHover;
            drawHover(context, __assign(__assign({ key: node }, data), { size: size, x: x, y: y }), _this.settings);
        };
        var nodesToRender = [];
        if (this.hoveredNode && !this.nodeDataCache[this.hoveredNode].hidden) {
            nodesToRender.push(this.hoveredNode);
        }
        this.highlightedNodes.forEach(function (node) {
            // The hovered node has already been highlighted
            if (node !== _this.hoveredNode)
                nodesToRender.push(node);
        });
        // Draw labels:
        nodesToRender.forEach(function (node) { return render(node); });
        // Draw WebGL nodes on top of the labels:
        var nodesPerPrograms = {};
        // 1. Count nodes per type:
        nodesToRender.forEach(function (node) {
            var type = _this.nodeDataCache[node].type;
            nodesPerPrograms[type] = (nodesPerPrograms[type] || 0) + 1;
        });
        // 2. Allocate for each type for the proper number of nodes
        for (var type in this.nodeHoverPrograms) {
            this.nodeHoverPrograms[type].reallocate(nodesPerPrograms[type] || 0);
            // Also reset count, to use when rendering:
            nodesPerPrograms[type] = 0;
        }
        // 3. Process all nodes to render:
        nodesToRender.forEach(function (node) {
            var data = _this.nodeDataCache[node];
            _this.nodeHoverPrograms[data.type].process(0, nodesPerPrograms[data.type]++, data);
        });
        // 4. Clear hovered nodes layer:
        this.webGLContexts.hoverNodes.clear(this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT);
        // 5. Render:
        for (var type in this.nodeHoverPrograms) {
            var program = this.nodeHoverPrograms[type];
            program.render({
                matrix: this.matrix,
                width: this.width,
                height: this.height,
                pixelRatio: this.pixelRatio,
                zoomRatio: this.camera.ratio,
                sizeRatio: 1 / this.scaleSize(),
                correctionRatio: this.correctionRatio,
                downSizingRatio: this.pickingDownSizingRatio,
            });
        }
    };
    /**
     * Method used to schedule a hover render.
     *
     */
    Sigma.prototype.scheduleHighlightedNodesRender = function () {
        var _this = this;
        if (this.renderHighlightedNodesFrame || this.renderFrame)
            return;
        this.renderHighlightedNodesFrame = (0, utils_1.requestFrame)(function () {
            // Resetting state
            _this.renderHighlightedNodesFrame = null;
            // Rendering
            _this.renderHighlightedNodes();
            _this.renderEdgeLabels();
        });
    };
    /**
     * Method used to render.
     *
     * @return {Sigma}
     */
    Sigma.prototype.render = function () {
        var _this = this;
        this.emit("beforeRender");
        var exitRender = function () {
            _this.emit("afterRender");
            return _this;
        };
        // If a render was scheduled, we cancel it
        if (this.renderFrame) {
            (0, utils_1.cancelFrame)(this.renderFrame);
            this.renderFrame = null;
        }
        // First we need to resize
        this.resize();
        // Do we need to reprocess data?
        if (this.needToProcess)
            this.process();
        this.needToProcess = false;
        // Clearing the canvases
        this.clear();
        // Prepare the textures
        this.pickingLayers.forEach(function (layer) { return _this.resetWebGLTexture(layer); });
        // If we have no nodes we can stop right there
        if (!this.graph.order)
            return exitRender();
        // TODO: improve this heuristic or move to the captor itself?
        // TODO: deal with the touch captor here as well
        var mouseCaptor = this.mouseCaptor;
        var moving = this.camera.isAnimated() ||
            mouseCaptor.isMoving ||
            mouseCaptor.draggedEvents ||
            mouseCaptor.currentWheelDirection;
        // Then we need to extract a matrix from the camera
        var cameraState = this.camera.getState();
        var viewportDimensions = this.getDimensions();
        var graphDimensions = this.getGraphDimensions();
        var padding = this.getSetting("stagePadding") || 0;
        this.matrix = (0, utils_1.matrixFromCamera)(cameraState, viewportDimensions, graphDimensions, padding);
        this.invMatrix = (0, utils_1.matrixFromCamera)(cameraState, viewportDimensions, graphDimensions, padding, true);
        this.correctionRatio = (0, utils_1.getMatrixImpact)(this.matrix, cameraState, viewportDimensions);
        this.graphToViewportRatio = this.getGraphToViewportRatio();
        // [jacomyal]
        // This comment is related to the one above the `getMatrixImpact` definition:
        // - `this.correctionRatio` is somehow not completely explained
        // - `this.graphToViewportRatio` is the ratio of a distance in the viewport divided by the same distance in the
        //   graph
        // - `this.normalizationFunction.ratio` is basically `Math.max(graphDX, graphDY)`
        // And now, I observe that if I multiply these three ratios, I have something constant, which value remains 2, even
        // when I change the graph, the viewport or the camera. It might be useful later so I prefer to let this comment:
        // console.log(this.graphToViewportRatio * this.correctionRatio * this.normalizationFunction.ratio * 2);
        var params = {
            matrix: this.matrix,
            width: this.width,
            height: this.height,
            pixelRatio: this.pixelRatio,
            zoomRatio: this.camera.ratio,
            sizeRatio: 1 / this.scaleSize(),
            correctionRatio: this.correctionRatio,
            downSizingRatio: this.pickingDownSizingRatio,
        };
        // Drawing nodes
        for (var type in this.nodePrograms) {
            var program = this.nodePrograms[type];
            program.render(params);
        }
        // Drawing edges
        if (!this.settings.hideEdgesOnMove || !moving) {
            for (var type in this.edgePrograms) {
                var program = this.edgePrograms[type];
                program.render(params);
            }
        }
        // Do not display labels on move per setting
        if (this.settings.hideLabelsOnMove && moving)
            return exitRender();
        this.renderLabels();
        this.renderEdgeLabels();
        this.renderHighlightedNodes();
        return exitRender();
    };
    /**
     * Add a node in the internal data structures.
     * @private
     * @param key The node's graphology ID
     */
    Sigma.prototype.addNode = function (key) {
        // Node display data resolution:
        //  1. First we get the node's attributes
        //  2. We optionally reduce them using the function provided by the user
        //     Note that this function must return a total object and won't be merged
        //  3. We apply our defaults, while running some vital checks
        //  4. We apply the normalization function
        // We shallow copy node data to avoid dangerous behaviors from reducers
        var attr = Object.assign({}, this.graph.getNodeAttributes(key));
        if (this.settings.nodeReducer)
            attr = this.settings.nodeReducer(key, attr);
        var data = applyNodeDefaults(this.settings, key, attr);
        this.nodeDataCache[key] = data;
        // Label:
        // We delete and add if needed because this function is also used from
        // update
        this.nodesWithForcedLabels.delete(key);
        if (data.forceLabel && !data.hidden)
            this.nodesWithForcedLabels.add(key);
        // Highlighted:
        // We remove and re add if needed because this function is also used from
        // update
        this.highlightedNodes.delete(key);
        if (data.highlighted && !data.hidden)
            this.highlightedNodes.add(key);
        // zIndex
        if (this.settings.zIndex) {
            if (data.zIndex < this.nodeZExtent[0])
                this.nodeZExtent[0] = data.zIndex;
            if (data.zIndex > this.nodeZExtent[1])
                this.nodeZExtent[1] = data.zIndex;
        }
    };
    /**
     * Update a node the internal data structures.
     * @private
     * @param key The node's graphology ID
     */
    Sigma.prototype.updateNode = function (key) {
        this.addNode(key);
        // Re-apply normalization on the node
        var data = this.nodeDataCache[key];
        this.normalizationFunction.applyTo(data);
    };
    /**
     * Remove a node from the internal data structures.
     * @private
     * @param key The node's graphology ID
     */
    Sigma.prototype.removeNode = function (key) {
        // Remove from node cache
        delete this.nodeDataCache[key];
        // Remove from node program index
        delete this.nodeProgramIndex[key];
        // Remove from higlighted nodes
        this.highlightedNodes.delete(key);
        // Remove from hovered
        if (this.hoveredNode === key)
            this.hoveredNode = null;
        // Remove from forced label
        this.nodesWithForcedLabels.delete(key);
    };
    /**
     * Add an edge into the internal data structures.
     * @private
     * @param key The edge's graphology ID
     */
    Sigma.prototype.addEdge = function (key) {
        // Edge display data resolution:
        //  1. First we get the edge's attributes
        //  2. We optionally reduce them using the function provided by the user
        //  3. Note that this function must return a total object and won't be merged
        //  4. We apply our defaults, while running some vital checks
        // We shallow copy edge data to avoid dangerous behaviors from reducers
        var attr = Object.assign({}, this.graph.getEdgeAttributes(key));
        if (this.settings.edgeReducer)
            attr = this.settings.edgeReducer(key, attr);
        var data = applyEdgeDefaults(this.settings, key, attr);
        this.edgeDataCache[key] = data;
        // Forced label
        // we filter and re push if needed because this function is also used from
        // update
        this.edgesWithForcedLabels.delete(key);
        if (data.forceLabel && !data.hidden)
            this.edgesWithForcedLabels.add(key);
        // Check zIndex
        if (this.settings.zIndex) {
            if (data.zIndex < this.edgeZExtent[0])
                this.edgeZExtent[0] = data.zIndex;
            if (data.zIndex > this.edgeZExtent[1])
                this.edgeZExtent[1] = data.zIndex;
        }
    };
    /**
     * Update an edge in the internal data structures.
     * @private
     * @param key The edge's graphology ID
     */
    Sigma.prototype.updateEdge = function (key) {
        this.addEdge(key);
    };
    /**
     * Remove an edge from the internal data structures.
     * @private
     * @param key The edge's graphology ID
     */
    Sigma.prototype.removeEdge = function (key) {
        // Remove from edge cache
        delete this.edgeDataCache[key];
        // Remove from programId index
        delete this.edgeProgramIndex[key];
        // Remove from hovered
        if (this.hoveredEdge === key)
            this.hoveredEdge = null;
        // Remove from forced label
        this.edgesWithForcedLabels.delete(key);
    };
    /**
     * Clear all indices related to nodes.
     * @private
     */
    Sigma.prototype.clearNodeIndices = function () {
        // LabelGrid & nodeExtent are only manage/populated in the process function
        this.labelGrid = new labels_1.LabelGrid();
        this.nodeExtent = { x: [0, 1], y: [0, 1] };
        this.nodeDataCache = {};
        this.edgeProgramIndex = {};
        this.nodesWithForcedLabels = new Set();
        this.nodeZExtent = [Infinity, -Infinity];
    };
    /**
     * Clear all indices related to edges.
     * @private
     */
    Sigma.prototype.clearEdgeIndices = function () {
        this.edgeDataCache = {};
        this.edgeProgramIndex = {};
        this.edgesWithForcedLabels = new Set();
        this.edgeZExtent = [Infinity, -Infinity];
    };
    /**
     * Clear all indices.
     * @private
     */
    Sigma.prototype.clearIndices = function () {
        this.clearEdgeIndices();
        this.clearNodeIndices();
    };
    /**
     * Clear all graph state related to nodes.
     * @private
     */
    Sigma.prototype.clearNodeState = function () {
        this.displayedNodeLabels = new Set();
        this.highlightedNodes = new Set();
        this.hoveredNode = null;
    };
    /**
     * Clear all graph state related to edges.
     * @private
     */
    Sigma.prototype.clearEdgeState = function () {
        this.displayedEdgeLabels = new Set();
        this.highlightedNodes = new Set();
        this.hoveredEdge = null;
    };
    /**
     * Clear all graph state.
     * @private
     */
    Sigma.prototype.clearState = function () {
        this.clearEdgeState();
        this.clearNodeState();
    };
    /**
     * Add the node data to its program.
     * @private
     * @param node The node's graphology ID
     * @param fingerprint A fingerprint used to identity the node with picking
     * @param position The index where to place the node in the program
     */
    Sigma.prototype.addNodeToProgram = function (node, fingerprint, position) {
        var data = this.nodeDataCache[node];
        var nodeProgram = this.nodePrograms[data.type];
        if (!nodeProgram)
            throw new Error("Sigma: could not find a suitable program for node type \"".concat(data.type, "\"!"));
        nodeProgram.process(fingerprint, position, data);
        // Saving program index
        this.nodeProgramIndex[node] = position;
    };
    /**
     * Add the edge data to its program.
     * @private
     * @param edge The edge's graphology ID
     * @param fingerprint A fingerprint used to identity the edge with picking
     * @param position The index where to place the edge in the program
     */
    Sigma.prototype.addEdgeToProgram = function (edge, fingerprint, position) {
        var data = this.edgeDataCache[edge];
        var edgeProgram = this.edgePrograms[data.type];
        if (!edgeProgram)
            throw new Error("Sigma: could not find a suitable program for edge type \"".concat(data.type, "\"!"));
        var extremities = this.graph.extremities(edge), sourceData = this.nodeDataCache[extremities[0]], targetData = this.nodeDataCache[extremities[1]];
        edgeProgram.process(fingerprint, position, sourceData, targetData, data);
        // Saving program index
        this.edgeProgramIndex[edge] = position;
    };
    /**---------------------------------------------------------------------------
     * Public API.
     **---------------------------------------------------------------------------
     */
    /**
     * Method returning the renderer's camera.
     *
     * @return {Camera}
     */
    Sigma.prototype.getCamera = function () {
        return this.camera;
    };
    /**
     * Method setting the renderer's camera.
     *
     * @param  {Camera} camera - New camera.
     * @return {Sigma}
     */
    Sigma.prototype.setCamera = function (camera) {
        this.unbindCameraHandlers();
        this.camera = camera;
        this.bindCameraHandlers();
    };
    /**
     * Method returning the container DOM element.
     *
     * @return {HTMLElement}
     */
    Sigma.prototype.getContainer = function () {
        return this.container;
    };
    /**
     * Method returning the renderer's graph.
     *
     * @return {Graph}
     */
    Sigma.prototype.getGraph = function () {
        return this.graph;
    };
    /**
     * Method used to set the renderer's graph.
     *
     * @return {Graph}
     */
    Sigma.prototype.setGraph = function (graph) {
        if (graph === this.graph)
            return;
        // Unbinding handlers on the current graph
        this.unbindGraphHandlers();
        if (this.checkEdgesEventsFrame !== null) {
            (0, utils_1.cancelFrame)(this.checkEdgesEventsFrame);
            this.checkEdgesEventsFrame = null;
        }
        // Installing new graph
        this.graph = graph;
        // Binding new handlers
        this.bindGraphHandlers();
        // Re-rendering now to avoid discrepancies from now to next frame
        this.refresh();
    };
    /**
     * Method returning the mouse captor.
     *
     * @return {MouseCaptor}
     */
    Sigma.prototype.getMouseCaptor = function () {
        return this.mouseCaptor;
    };
    /**
     * Method returning the touch captor.
     *
     * @return {TouchCaptor}
     */
    Sigma.prototype.getTouchCaptor = function () {
        return this.touchCaptor;
    };
    /**
     * Method returning the current renderer's dimensions.
     *
     * @return {Dimensions}
     */
    Sigma.prototype.getDimensions = function () {
        return { width: this.width, height: this.height };
    };
    /**
     * Method returning the current graph's dimensions.
     *
     * @return {Dimensions}
     */
    Sigma.prototype.getGraphDimensions = function () {
        var extent = this.customBBox || this.nodeExtent;
        return {
            width: extent.x[1] - extent.x[0] || 1,
            height: extent.y[1] - extent.y[0] || 1,
        };
    };
    /**
     * Method used to get all the sigma node attributes.
     * It's usefull for example to get the position of a node
     * and to get values that are set by the nodeReducer
     *
     * @param  {string} key - The node's key.
     * @return {NodeDisplayData | undefined} A copy of the desired node's attribute or undefined if not found
     */
    Sigma.prototype.getNodeDisplayData = function (key) {
        var node = this.nodeDataCache[key];
        return node ? Object.assign({}, node) : undefined;
    };
    /**
     * Method used to get all the sigma edge attributes.
     * It's useful for example to get values that are set by the edgeReducer.
     *
     * @param  {string} key - The edge's key.
     * @return {EdgeDisplayData | undefined} A copy of the desired edge's attribute or undefined if not found
     */
    Sigma.prototype.getEdgeDisplayData = function (key) {
        var edge = this.edgeDataCache[key];
        return edge ? Object.assign({}, edge) : undefined;
    };
    /**
     * Method used to get the set of currently displayed node labels.
     *
     * @return {Set<string>} A set of node keys whose label is displayed.
     */
    Sigma.prototype.getNodeDisplayedLabels = function () {
        return new Set(this.displayedNodeLabels);
    };
    /**
     * Method used to get the set of currently displayed edge labels.
     *
     * @return {Set<string>} A set of edge keys whose label is displayed.
     */
    Sigma.prototype.getEdgeDisplayedLabels = function () {
        return new Set(this.displayedEdgeLabels);
    };
    /**
     * Method returning a copy of the settings collection.
     *
     * @return {Settings} A copy of the settings collection.
     */
    Sigma.prototype.getSettings = function () {
        return __assign({}, this.settings);
    };
    /**
     * Method returning the current value for a given setting key.
     *
     * @param  {string} key - The setting key to get.
     * @return {any} The value attached to this setting key or undefined if not found
     */
    Sigma.prototype.getSetting = function (key) {
        return this.settings[key];
    };
    /**
     * Method setting the value of a given setting key. Note that this will schedule
     * a new render next frame.
     *
     * @param  {string} key - The setting key to set.
     * @param  {any}    value - The value to set.
     * @return {Sigma}
     */
    Sigma.prototype.setSetting = function (key, value) {
        this.settings[key] = value;
        (0, settings_1.validateSettings)(this.settings);
        this.handleSettingsUpdate();
        this.refresh();
        return this;
    };
    /**
     * Method updating the value of a given setting key using the provided function.
     * Note that this will schedule a new render next frame.
     *
     * @param  {string}   key     - The setting key to set.
     * @param  {function} updater - The update function.
     * @return {Sigma}
     */
    Sigma.prototype.updateSetting = function (key, updater) {
        this.settings[key] = updater(this.settings[key]);
        (0, settings_1.validateSettings)(this.settings);
        this.handleSettingsUpdate();
        this.scheduleRefresh();
        return this;
    };
    /**
     * Method used to resize the renderer.
     *
     * @return {Sigma}
     */
    Sigma.prototype.resize = function () {
        var previousWidth = this.width, previousHeight = this.height;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.pixelRatio = (0, utils_1.getPixelRatio)();
        if (this.width === 0) {
            if (this.settings.allowInvalidContainer)
                this.width = 1;
            else
                throw new Error("Sigma: Container has no width. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }
        if (this.height === 0) {
            if (this.settings.allowInvalidContainer)
                this.height = 1;
            else
                throw new Error("Sigma: Container has no height. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }
        // If nothing has changed, we can stop right here
        if (previousWidth === this.width && previousHeight === this.height)
            return this;
        this.emit("resize");
        // Sizing dom elements
        for (var id in this.elements) {
            var element = this.elements[id];
            element.style.width = this.width + "px";
            element.style.height = this.height + "px";
        }
        // Sizing canvas contexts
        for (var id in this.canvasContexts) {
            this.elements[id].setAttribute("width", this.width * this.pixelRatio + "px");
            this.elements[id].setAttribute("height", this.height * this.pixelRatio + "px");
            if (this.pixelRatio !== 1)
                this.canvasContexts[id].scale(this.pixelRatio, this.pixelRatio);
        }
        // Sizing WebGL contexts
        for (var id in this.webGLContexts) {
            this.elements[id].setAttribute("width", this.width * this.pixelRatio + "px");
            this.elements[id].setAttribute("height", this.height * this.pixelRatio + "px");
            var gl = this.webGLContexts[id];
            gl.viewport(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);
            // Clear picking texture if needed
            if (this.pickingLayers.has(id)) {
                var currentTexture = this.textures[id];
                if (currentTexture)
                    gl.deleteTexture(currentTexture);
            }
        }
        return this;
    };
    /**
     * Method used to clear all the canvases.
     *
     * @return {Sigma}
     */
    Sigma.prototype.clear = function () {
        this.webGLContexts.nodes.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.nodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.edges.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.edges.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.hoverNodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.canvasContexts.labels.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.hovers.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.edgeLabels.clearRect(0, 0, this.width, this.height);
        return this;
    };
    /**
     * Method used to refresh, i.e. force the renderer to reprocess graph
     * data and render, but keep the state.
     * - if a partialGraph is provided, we only reprocess those nodes & edges.
     * - if schedule is TRUE, we schedule a render instead of sync render
     * - if skipIndexation is TRUE, then labelGrid & program indexation are skipped (can be used if you haven't modify x, y, zIndex & size)
     *
     * @return {Sigma}
     */
    Sigma.prototype.refresh = function (opts) {
        var _this = this;
        var _a, _b;
        var skipIndexation = (opts === null || opts === void 0 ? void 0 : opts.skipIndexation) !== undefined ? opts === null || opts === void 0 ? void 0 : opts.skipIndexation : false;
        var schedule = (opts === null || opts === void 0 ? void 0 : opts.schedule) !== undefined ? opts.schedule : false;
        var fullRefresh = !opts || !opts.partialGraph;
        if (fullRefresh) {
            // Re-index graph data
            this.clearEdgeIndices();
            this.clearNodeIndices();
            this.graph.forEachNode(function (node) { return _this.addNode(node); });
            this.graph.forEachEdge(function (edge) { return _this.addEdge(edge); });
        }
        else {
            var nodes = ((_a = opts.partialGraph) === null || _a === void 0 ? void 0 : _a.nodes) || [];
            for (var i = 0, l = (nodes === null || nodes === void 0 ? void 0 : nodes.length) || 0; i < l; i++) {
                var node = nodes[i];
                // Recompute node's data (ie. apply reducer)
                this.updateNode(node);
                // Add node to the program if layout is unchanged.
                // otherwise it will be done in the process function
                if (skipIndexation) {
                    var programIndex = this.nodeProgramIndex[node];
                    if (programIndex === undefined)
                        throw new Error("Sigma: node \"".concat(node, "\" can't be repaint"));
                    this.addNodeToProgram(node, this.nodeIndices[node], programIndex);
                }
            }
            var edges = ((_b = opts === null || opts === void 0 ? void 0 : opts.partialGraph) === null || _b === void 0 ? void 0 : _b.edges) || [];
            for (var i = 0, l = edges.length; i < l; i++) {
                var edge = edges[i];
                // Recompute edge's data (ie. apply reducer)
                this.updateEdge(edge);
                // Add edge to the program
                // otherwise it will be done in the process function
                if (skipIndexation) {
                    var programIndex = this.edgeProgramIndex[edge];
                    if (programIndex === undefined)
                        throw new Error("Sigma: edge \"".concat(edge, "\" can't be repaint"));
                    this.addEdgeToProgram(edge, this.edgeIndices[edge], programIndex);
                }
            }
        }
        // Do we need to call the process function ?
        if (fullRefresh || !skipIndexation)
            this.needToProcess = true;
        if (schedule)
            this.scheduleRender();
        else
            this.render();
        return this;
    };
    /**
     * Method used to schedule a render at the next available frame.
     * This method can be safely called on a same frame because it basically
     * debounces refresh to the next frame.
     *
     * @return {Sigma}
     */
    Sigma.prototype.scheduleRender = function () {
        var _this = this;
        if (!this.renderFrame) {
            this.renderFrame = (0, utils_1.requestFrame)(function () {
                _this.render();
            });
        }
        return this;
    };
    /**
     * Method used to schedule a refresh (i.e. fully reprocess graph data and render)
     * at the next available frame.
     * This method can be safely called on a same frame because it basically
     * debounces refresh to the next frame.
     *
     * @return {Sigma}
     */
    Sigma.prototype.scheduleRefresh = function (opts) {
        return this.refresh(__assign(__assign({}, opts), { schedule: true }));
    };
    /**
     * Method used to (un)zoom, while preserving the position of a viewport point.
     * Used for instance to zoom "on the mouse cursor".
     *
     * @param viewportTarget
     * @param newRatio
     * @return {CameraState}
     */
    Sigma.prototype.getViewportZoomedState = function (viewportTarget, newRatio) {
        var _a = this.camera.getState(), ratio = _a.ratio, angle = _a.angle, x = _a.x, y = _a.y;
        // TODO: handle max zoom
        var ratioDiff = newRatio / ratio;
        var center = {
            x: this.width / 2,
            y: this.height / 2,
        };
        var graphMousePosition = this.viewportToFramedGraph(viewportTarget);
        var graphCenterPosition = this.viewportToFramedGraph(center);
        return {
            angle: angle,
            x: (graphMousePosition.x - graphCenterPosition.x) * (1 - ratioDiff) + x,
            y: (graphMousePosition.y - graphCenterPosition.y) * (1 - ratioDiff) + y,
            ratio: newRatio,
        };
    };
    /**
     * Method returning the abstract rectangle containing the graph according
     * to the camera's state.
     *
     * @return {object} - The view's rectangle.
     */
    Sigma.prototype.viewRectangle = function () {
        // TODO: reduce relative margin?
        var marginX = (0 * this.width) / 8, marginY = (0 * this.height) / 8;
        var p1 = this.viewportToFramedGraph({ x: 0 - marginX, y: 0 - marginY }), p2 = this.viewportToFramedGraph({ x: this.width + marginX, y: 0 - marginY }), h = this.viewportToFramedGraph({ x: 0, y: this.height + marginY });
        return {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            height: p2.y - h.y,
        };
    };
    /**
     * Method returning the coordinates of a point from the framed graph system to the viewport system. It allows
     * overriding anything that is used to get the translation matrix, or even the matrix itself.
     *
     * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
     * of computations.
     */
    Sigma.prototype.framedGraphToViewport = function (coordinates, override) {
        if (override === void 0) { override = {}; }
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !!override.graphDimensions;
        var matrix = override.matrix
            ? override.matrix
            : recomputeMatrix
                ? (0, utils_1.matrixFromCamera)(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getSetting("stagePadding") || 0)
                : this.matrix;
        var viewportPos = (0, matrices_1.multiplyVec2)(matrix, coordinates);
        return {
            x: ((1 + viewportPos.x) * this.width) / 2,
            y: ((1 - viewportPos.y) * this.height) / 2,
        };
    };
    /**
     * Method returning the coordinates of a point from the viewport system to the framed graph system. It allows
     * overriding anything that is used to get the translation matrix, or even the matrix itself.
     *
     * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
     * of computations.
     */
    Sigma.prototype.viewportToFramedGraph = function (coordinates, override) {
        if (override === void 0) { override = {}; }
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !override.graphDimensions;
        var invMatrix = override.matrix
            ? override.matrix
            : recomputeMatrix
                ? (0, utils_1.matrixFromCamera)(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getSetting("stagePadding") || 0, true)
                : this.invMatrix;
        var res = (0, matrices_1.multiplyVec2)(invMatrix, {
            x: (coordinates.x / this.width) * 2 - 1,
            y: 1 - (coordinates.y / this.height) * 2,
        });
        if (isNaN(res.x))
            res.x = 0;
        if (isNaN(res.y))
            res.y = 0;
        return res;
    };
    /**
     * Method used to translate a point's coordinates from the viewport system (pixel distance from the top-left of the
     * stage) to the graph system (the reference system of data as they are in the given graph instance).
     *
     * This method accepts an optional camera which can be useful if you need to translate coordinates
     * based on a different view than the one being currently being displayed on screen.
     *
     * @param {Coordinates}                  viewportPoint
     * @param {CoordinateConversionOverride} override
     */
    Sigma.prototype.viewportToGraph = function (viewportPoint, override) {
        if (override === void 0) { override = {}; }
        return this.normalizationFunction.inverse(this.viewportToFramedGraph(viewportPoint, override));
    };
    /**
     * Method used to translate a point's coordinates from the graph system (the reference system of data as they are in
     * the given graph instance) to the viewport system (pixel distance from the top-left of the stage).
     *
     * This method accepts an optional camera which can be useful if you need to translate coordinates
     * based on a different view than the one being currently being displayed on screen.
     *
     * @param {Coordinates}                  graphPoint
     * @param {CoordinateConversionOverride} override
     */
    Sigma.prototype.graphToViewport = function (graphPoint, override) {
        if (override === void 0) { override = {}; }
        return this.framedGraphToViewport(this.normalizationFunction(graphPoint), override);
    };
    /**
     * Method returning the distance multiplier between the graph system and the
     * viewport system.
     */
    Sigma.prototype.getGraphToViewportRatio = function () {
        var graphP1 = { x: 0, y: 0 };
        var graphP2 = { x: 1, y: 1 };
        var graphD = Math.sqrt(Math.pow(graphP1.x - graphP2.x, 2) + Math.pow(graphP1.y - graphP2.y, 2));
        var viewportP1 = this.graphToViewport(graphP1);
        var viewportP2 = this.graphToViewport(graphP2);
        var viewportD = Math.sqrt(Math.pow(viewportP1.x - viewportP2.x, 2) + Math.pow(viewportP1.y - viewportP2.y, 2));
        return viewportD / graphD;
    };
    /**
     * Method returning the graph's bounding box.
     *
     * @return {{ x: Extent, y: Extent }}
     */
    Sigma.prototype.getBBox = function () {
        return this.nodeExtent;
    };
    /**
     * Method returning the graph's custom bounding box, if any.
     *
     * @return {{ x: Extent, y: Extent } | null}
     */
    Sigma.prototype.getCustomBBox = function () {
        return this.customBBox;
    };
    /**
     * Method used to override the graph's bounding box with a custom one. Give `null` as the argument to stop overriding.
     *
     * @return {Sigma}
     */
    Sigma.prototype.setCustomBBox = function (customBBox) {
        this.customBBox = customBBox;
        this.scheduleRender();
        return this;
    };
    /**
     * Method used to shut the container & release event listeners.
     *
     * @return {undefined}
     */
    Sigma.prototype.kill = function () {
        var _a;
        // Emitting "kill" events so that plugins and such can cleanup
        this.emit("kill");
        // Releasing events
        this.removeAllListeners();
        // Releasing camera handlers
        this.unbindCameraHandlers();
        // Releasing DOM events & captors
        window.removeEventListener("resize", this.activeListeners.handleResize);
        this.mouseCaptor.kill();
        this.touchCaptor.kill();
        // Releasing graph handlers
        this.unbindGraphHandlers();
        // Releasing cache & state
        this.clearIndices();
        this.clearState();
        this.nodeDataCache = {};
        this.edgeDataCache = {};
        this.highlightedNodes.clear();
        // Clearing frames
        if (this.renderFrame) {
            (0, utils_1.cancelFrame)(this.renderFrame);
            this.renderFrame = null;
        }
        if (this.renderHighlightedNodesFrame) {
            (0, utils_1.cancelFrame)(this.renderHighlightedNodesFrame);
            this.renderHighlightedNodesFrame = null;
        }
        // Destroying WebGL contexts
        for (var id in this.webGLContexts) {
            var context = this.webGLContexts[id];
            (_a = context.getExtension("WEBGL_lose_context")) === null || _a === void 0 ? void 0 : _a.loseContext();
        }
        // Destroying canvases
        var container = this.container;
        while (container.firstChild)
            container.removeChild(container.firstChild);
        // Destroying remaining collections
        this.canvasContexts = {};
        this.webGLContexts = {};
        this.elements = {};
        this.nodePrograms = {};
        this.nodeHoverPrograms = {};
        this.edgePrograms = {};
    };
    /**
     * Method used to scale the given size according to the camera's ratio, i.e.
     * zooming state.
     *
     * @param  {number?} size -        The size to scale (node size, edge thickness etc.).
     * @param  {number?} cameraRatio - A camera ratio (defaults to the actual camera ratio).
     * @return {number}              - The scaled size.
     */
    Sigma.prototype.scaleSize = function (size, cameraRatio) {
        if (size === void 0) { size = 1; }
        if (cameraRatio === void 0) { cameraRatio = this.camera.ratio; }
        return ((size / this.settings.zoomToSizeRatioFunction(cameraRatio)) *
            (this.getSetting("itemSizesReference") === "positions" ? cameraRatio * this.graphToViewportRatio : 1));
    };
    /**
     * Method that returns the collection of all used canvases.
     * At the moment, the instantiated canvases are the following, and in the
     * following order in the DOM:
     * - `edges`
     * - `nodes`
     * - `edgeLabels`
     * - `labels`
     * - `hovers`
     * - `hoverNodes`
     * - `mouse`
     *
     * @return {PlainObject<HTMLCanvasElement>} - The collection of canvases.
     */
    Sigma.prototype.getCanvases = function () {
        return __assign({}, this.elements);
    };
    return Sigma;
}(types_1.TypedEventEmitter));
exports["default"] = Sigma;


/***/ }),

/***/ "./node_modules/sigma/types.js":
/*!*************************************!*\
  !*** ./node_modules/sigma/types.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TypedEventEmitter = void 0;
/**
 * Sigma.js Types
 * ===============
 *
 * Various type declarations used throughout the library.
 * @module
 */
var events_1 = __webpack_require__(/*! events */ "./node_modules/events/events.js");
var TypedEventEmitter = /** @class */ (function (_super) {
    __extends(TypedEventEmitter, _super);
    function TypedEventEmitter() {
        var _this = _super.call(this) || this;
        _this.rawEmitter = _this;
        return _this;
    }
    return TypedEventEmitter;
}(events_1.EventEmitter));
exports.TypedEventEmitter = TypedEventEmitter;


/***/ }),

/***/ "./node_modules/sigma/utils/animate.js":
/*!*********************************************!*\
  !*** ./node_modules/sigma/utils/animate.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.animateNodes = exports.ANIMATE_DEFAULTS = void 0;
var index_1 = __webpack_require__(/*! ./index */ "./node_modules/sigma/utils/index.js");
var easings_1 = __importDefault(__webpack_require__(/*! ./easings */ "./node_modules/sigma/utils/easings.js"));
exports.ANIMATE_DEFAULTS = {
    easing: "quadraticInOut",
    duration: 150,
};
/**
 * Function used to animate the nodes.
 */
function animateNodes(graph, targets, opts, callback) {
    var options = Object.assign({}, exports.ANIMATE_DEFAULTS, opts);
    var easing = typeof options.easing === "function" ? options.easing : easings_1.default[options.easing];
    var start = Date.now();
    var startPositions = {};
    for (var node in targets) {
        var attrs = targets[node];
        startPositions[node] = {};
        for (var k in attrs)
            startPositions[node][k] = graph.getNodeAttribute(node, k);
    }
    var frame = null;
    var step = function () {
        frame = null;
        var p = (Date.now() - start) / options.duration;
        if (p >= 1) {
            // Animation is done
            for (var node in targets) {
                var attrs = targets[node];
                // We use given values to avoid precision issues and for convenience
                for (var k in attrs)
                    graph.setNodeAttribute(node, k, attrs[k]);
            }
            if (typeof callback === "function")
                callback();
            return;
        }
        p = easing(p);
        for (var node in targets) {
            var attrs = targets[node];
            var s = startPositions[node];
            for (var k in attrs)
                graph.setNodeAttribute(node, k, attrs[k] * p + s[k] * (1 - p));
        }
        frame = (0, index_1.requestFrame)(step);
    };
    step();
    return function () {
        if (frame)
            (0, index_1.cancelFrame)(frame);
    };
}
exports.animateNodes = animateNodes;


/***/ }),

/***/ "./node_modules/sigma/utils/array.js":
/*!*******************************************!*\
  !*** ./node_modules/sigma/utils/array.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * Extend function
 * ================
 *
 * Function used to push a bunch of values into an array at once.
 * Freely inspired by @Yomguithereal/helpers/extend.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extend = void 0;
/**
 * Extends the target array with the given values.
 *
 * @param  {array} array  - Target array.
 * @param  {array} values - A set of the values to add.
 */
function extend(array, values) {
    var l2 = values.size;
    if (l2 === 0)
        return;
    var l1 = array.length;
    array.length += l2;
    var i = 0;
    values.forEach(function (value) {
        array[l1 + i] = value;
        i++;
    });
}
exports.extend = extend;


/***/ }),

/***/ "./node_modules/sigma/utils/data.js":
/*!******************************************!*\
  !*** ./node_modules/sigma/utils/data.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HTML_COLORS = void 0;
exports.HTML_COLORS = {
    black: "#000000",
    silver: "#C0C0C0",
    gray: "#808080",
    grey: "#808080",
    white: "#FFFFFF",
    maroon: "#800000",
    red: "#FF0000",
    purple: "#800080",
    fuchsia: "#FF00FF",
    green: "#008000",
    lime: "#00FF00",
    olive: "#808000",
    yellow: "#FFFF00",
    navy: "#000080",
    blue: "#0000FF",
    teal: "#008080",
    aqua: "#00FFFF",
    darkblue: "#00008B",
    mediumblue: "#0000CD",
    darkgreen: "#006400",
    darkcyan: "#008B8B",
    deepskyblue: "#00BFFF",
    darkturquoise: "#00CED1",
    mediumspringgreen: "#00FA9A",
    springgreen: "#00FF7F",
    cyan: "#00FFFF",
    midnightblue: "#191970",
    dodgerblue: "#1E90FF",
    lightseagreen: "#20B2AA",
    forestgreen: "#228B22",
    seagreen: "#2E8B57",
    darkslategray: "#2F4F4F",
    darkslategrey: "#2F4F4F",
    limegreen: "#32CD32",
    mediumseagreen: "#3CB371",
    turquoise: "#40E0D0",
    royalblue: "#4169E1",
    steelblue: "#4682B4",
    darkslateblue: "#483D8B",
    mediumturquoise: "#48D1CC",
    indigo: "#4B0082",
    darkolivegreen: "#556B2F",
    cadetblue: "#5F9EA0",
    cornflowerblue: "#6495ED",
    rebeccapurple: "#663399",
    mediumaquamarine: "#66CDAA",
    dimgray: "#696969",
    dimgrey: "#696969",
    slateblue: "#6A5ACD",
    olivedrab: "#6B8E23",
    slategray: "#708090",
    slategrey: "#708090",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    mediumslateblue: "#7B68EE",
    lawngreen: "#7CFC00",
    chartreuse: "#7FFF00",
    aquamarine: "#7FFFD4",
    skyblue: "#87CEEB",
    lightskyblue: "#87CEFA",
    blueviolet: "#8A2BE2",
    darkred: "#8B0000",
    darkmagenta: "#8B008B",
    saddlebrown: "#8B4513",
    darkseagreen: "#8FBC8F",
    lightgreen: "#90EE90",
    mediumpurple: "#9370DB",
    darkviolet: "#9400D3",
    palegreen: "#98FB98",
    darkorchid: "#9932CC",
    yellowgreen: "#9ACD32",
    sienna: "#A0522D",
    brown: "#A52A2A",
    darkgray: "#A9A9A9",
    darkgrey: "#A9A9A9",
    lightblue: "#ADD8E6",
    greenyellow: "#ADFF2F",
    paleturquoise: "#AFEEEE",
    lightsteelblue: "#B0C4DE",
    powderblue: "#B0E0E6",
    firebrick: "#B22222",
    darkgoldenrod: "#B8860B",
    mediumorchid: "#BA55D3",
    rosybrown: "#BC8F8F",
    darkkhaki: "#BDB76B",
    mediumvioletred: "#C71585",
    indianred: "#CD5C5C",
    peru: "#CD853F",
    chocolate: "#D2691E",
    tan: "#D2B48C",
    lightgray: "#D3D3D3",
    lightgrey: "#D3D3D3",
    thistle: "#D8BFD8",
    orchid: "#DA70D6",
    goldenrod: "#DAA520",
    palevioletred: "#DB7093",
    crimson: "#DC143C",
    gainsboro: "#DCDCDC",
    plum: "#DDA0DD",
    burlywood: "#DEB887",
    lightcyan: "#E0FFFF",
    lavender: "#E6E6FA",
    darksalmon: "#E9967A",
    violet: "#EE82EE",
    palegoldenrod: "#EEE8AA",
    lightcoral: "#F08080",
    khaki: "#F0E68C",
    aliceblue: "#F0F8FF",
    honeydew: "#F0FFF0",
    azure: "#F0FFFF",
    sandybrown: "#F4A460",
    wheat: "#F5DEB3",
    beige: "#F5F5DC",
    whitesmoke: "#F5F5F5",
    mintcream: "#F5FFFA",
    ghostwhite: "#F8F8FF",
    salmon: "#FA8072",
    antiquewhite: "#FAEBD7",
    linen: "#FAF0E6",
    lightgoldenrodyellow: "#FAFAD2",
    oldlace: "#FDF5E6",
    magenta: "#FF00FF",
    deeppink: "#FF1493",
    orangered: "#FF4500",
    tomato: "#FF6347",
    hotpink: "#FF69B4",
    coral: "#FF7F50",
    darkorange: "#FF8C00",
    lightsalmon: "#FFA07A",
    orange: "#FFA500",
    lightpink: "#FFB6C1",
    pink: "#FFC0CB",
    gold: "#FFD700",
    peachpuff: "#FFDAB9",
    navajowhite: "#FFDEAD",
    moccasin: "#FFE4B5",
    bisque: "#FFE4C4",
    mistyrose: "#FFE4E1",
    blanchedalmond: "#FFEBCD",
    papayawhip: "#FFEFD5",
    lavenderblush: "#FFF0F5",
    seashell: "#FFF5EE",
    cornsilk: "#FFF8DC",
    lemonchiffon: "#FFFACD",
    floralwhite: "#FFFAF0",
    snow: "#FFFAFA",
    lightyellow: "#FFFFE0",
    ivory: "#FFFFF0",
};


/***/ }),

/***/ "./node_modules/sigma/utils/easings.js":
/*!*********************************************!*\
  !*** ./node_modules/sigma/utils/easings.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cubicInOut = exports.cubicOut = exports.cubicIn = exports.quadraticInOut = exports.quadraticOut = exports.quadraticIn = exports.linear = void 0;
/**
 * Sigma.js Easings
 * =================
 *
 * Handy collection of easing functions.
 * @module
 */
var linear = function (k) { return k; };
exports.linear = linear;
var quadraticIn = function (k) { return k * k; };
exports.quadraticIn = quadraticIn;
var quadraticOut = function (k) { return k * (2 - k); };
exports.quadraticOut = quadraticOut;
var quadraticInOut = function (k) {
    if ((k *= 2) < 1)
        return 0.5 * k * k;
    return -0.5 * (--k * (k - 2) - 1);
};
exports.quadraticInOut = quadraticInOut;
var cubicIn = function (k) { return k * k * k; };
exports.cubicIn = cubicIn;
var cubicOut = function (k) { return --k * k * k + 1; };
exports.cubicOut = cubicOut;
var cubicInOut = function (k) {
    if ((k *= 2) < 1)
        return 0.5 * k * k * k;
    return 0.5 * ((k -= 2) * k * k + 2);
};
exports.cubicInOut = cubicInOut;
var easings = {
    linear: exports.linear,
    quadraticIn: exports.quadraticIn,
    quadraticOut: exports.quadraticOut,
    quadraticInOut: exports.quadraticInOut,
    cubicIn: exports.cubicIn,
    cubicOut: exports.cubicOut,
    cubicInOut: exports.cubicInOut,
};
exports["default"] = easings;


/***/ }),

/***/ "./node_modules/sigma/utils/index.js":
/*!*******************************************!*\
  !*** ./node_modules/sigma/utils/index.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateGraph = exports.extractPixel = exports.getMatrixImpact = exports.matrixFromCamera = exports.getCorrectionRatio = exports.colorToIndex = exports.indexToColor = exports.floatColor = exports.rgbaToFloat = exports.parseColor = exports.zIndexOrdering = exports.createNormalizationFunction = exports.graphExtent = exports.getPixelRatio = exports.createElement = exports.cancelFrame = exports.requestFrame = exports.assignDeep = exports.assign = exports.isPlainObject = void 0;
var is_graph_1 = __importDefault(__webpack_require__(/*! graphology-utils/is-graph */ "./node_modules/graphology-utils/is-graph.js"));
var matrices_1 = __webpack_require__(/*! ./matrices */ "./node_modules/sigma/utils/matrices.js");
var data_1 = __webpack_require__(/*! ./data */ "./node_modules/sigma/utils/data.js");
/**
 * Checks whether the given value is a plain object.
 *
 * @param  {mixed}   value - Target value.
 * @return {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function isPlainObject(value) {
    return typeof value === "object" && value !== null && value.constructor === Object;
}
exports.isPlainObject = isPlainObject;
/**
 * Helper to use Object.assign with more than two objects.
 *
 * @param  {object} target       - First object.
 * @param  {object} [...objects] - Objects to merge.
 * @return {object}
 */
function assign(target) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    target = target || {};
    for (var i = 0, l = objects.length; i < l; i++) {
        var o = objects[i];
        if (!o)
            continue;
        Object.assign(target, o);
    }
    return target;
}
exports.assign = assign;
/**
 * Very simple recursive Object.assign-like function.
 *
 * @param  {object} target       - First object.
 * @param  {object} [...objects] - Objects to merge.
 * @return {object}
 */
function assignDeep(target) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    target = target || {};
    for (var i = 0, l = objects.length; i < l; i++) {
        var o = objects[i];
        if (!o)
            continue;
        for (var k in o) {
            if (isPlainObject(o[k])) {
                target[k] = assignDeep(target[k], o[k]);
            }
            else {
                target[k] = o[k];
            }
        }
    }
    return target;
}
exports.assignDeep = assignDeep;
/**
 * Just some dirty trick to make requestAnimationFrame and cancelAnimationFrame "work" in Node.js, for unit tests:
 */
exports.requestFrame = typeof requestAnimationFrame !== "undefined"
    ? function (callback) { return requestAnimationFrame(callback); }
    : function (callback) { return setTimeout(callback, 0); };
exports.cancelFrame = typeof cancelAnimationFrame !== "undefined"
    ? function (requestID) { return cancelAnimationFrame(requestID); }
    : function (requestID) { return clearTimeout(requestID); };
/**
 * Function used to create DOM elements easily.
 *
 * @param  {string} tag        - Tag name of the element to create.
 * @param  {object} style      - Styles map.
 * @param  {object} attributes - Attributes map.
 * @return {HTMLElement}
 */
function createElement(tag, style, attributes) {
    var element = document.createElement(tag);
    if (style) {
        for (var k in style) {
            element.style[k] = style[k];
        }
    }
    if (attributes) {
        for (var k in attributes) {
            element.setAttribute(k, attributes[k]);
        }
    }
    return element;
}
exports.createElement = createElement;
/**
 * Function returning the browser's pixel ratio.
 *
 * @return {number}
 */
function getPixelRatio() {
    if (typeof window.devicePixelRatio !== "undefined")
        return window.devicePixelRatio;
    return 1;
}
exports.getPixelRatio = getPixelRatio;
/**
 * Function returning the graph's node extent in x & y.
 *
 * @param  {Graph}
 * @return {object}
 */
function graphExtent(graph) {
    if (!graph.order)
        return { x: [0, 1], y: [0, 1] };
    var xMin = Infinity;
    var xMax = -Infinity;
    var yMin = Infinity;
    var yMax = -Infinity;
    graph.forEachNode(function (_, attr) {
        var x = attr.x, y = attr.y;
        if (x < xMin)
            xMin = x;
        if (x > xMax)
            xMax = x;
        if (y < yMin)
            yMin = y;
        if (y > yMax)
            yMax = y;
    });
    return { x: [xMin, xMax], y: [yMin, yMax] };
}
exports.graphExtent = graphExtent;
function createNormalizationFunction(extent) {
    var _b = __read(extent.x, 2), minX = _b[0], maxX = _b[1], _c = __read(extent.y, 2), minY = _c[0], maxY = _c[1];
    var ratio = Math.max(maxX - minX, maxY - minY), dX = (maxX + minX) / 2, dY = (maxY + minY) / 2;
    if (ratio === 0 || Math.abs(ratio) === Infinity || isNaN(ratio))
        ratio = 1;
    if (isNaN(dX))
        dX = 0;
    if (isNaN(dY))
        dY = 0;
    var fn = function (data) {
        return {
            x: 0.5 + (data.x - dX) / ratio,
            y: 0.5 + (data.y - dY) / ratio,
        };
    };
    // TODO: possibility to apply this in batch over array of indices
    fn.applyTo = function (data) {
        data.x = 0.5 + (data.x - dX) / ratio;
        data.y = 0.5 + (data.y - dY) / ratio;
    };
    fn.inverse = function (data) {
        return {
            x: dX + ratio * (data.x - 0.5),
            y: dY + ratio * (data.y - 0.5),
        };
    };
    fn.ratio = ratio;
    return fn;
}
exports.createNormalizationFunction = createNormalizationFunction;
/**
 * Function ordering the given elements in reverse z-order so they drawn
 * the correct way.
 *
 * @param  {number}   extent   - [min, max] z values.
 * @param  {function} getter   - Z attribute getter function.
 * @param  {array}    elements - The array to sort.
 * @return {array} - The sorted array.
 */
function zIndexOrdering(_extent, getter, elements) {
    // If k is > n, we'll use a standard sort
    return elements.sort(function (a, b) {
        var zA = getter(a) || 0, zB = getter(b) || 0;
        if (zA < zB)
            return -1;
        if (zA > zB)
            return 1;
        return 0;
    });
    // TODO: counting sort optimization
}
exports.zIndexOrdering = zIndexOrdering;
/**
 * WebGL utils
 * ===========
 */
/**
 * Memoized function returning a float-encoded color from various string
 * formats describing colors.
 */
var INT8 = new Int8Array(4);
var INT32 = new Int32Array(INT8.buffer, 0, 1);
var FLOAT32 = new Float32Array(INT8.buffer, 0, 1);
var RGBA_TEST_REGEX = /^\s*rgba?\s*\(/;
var RGBA_EXTRACT_REGEX = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/;
function parseColor(val) {
    var r = 0; // byte
    var g = 0; // byte
    var b = 0; // byte
    var a = 1; // float
    // Handling hexadecimal notation
    if (val[0] === "#") {
        if (val.length === 4) {
            r = parseInt(val.charAt(1) + val.charAt(1), 16);
            g = parseInt(val.charAt(2) + val.charAt(2), 16);
            b = parseInt(val.charAt(3) + val.charAt(3), 16);
        }
        else {
            r = parseInt(val.charAt(1) + val.charAt(2), 16);
            g = parseInt(val.charAt(3) + val.charAt(4), 16);
            b = parseInt(val.charAt(5) + val.charAt(6), 16);
        }
        if (val.length === 9) {
            a = parseInt(val.charAt(7) + val.charAt(8), 16) / 255;
        }
    }
    // Handling rgb notation
    else if (RGBA_TEST_REGEX.test(val)) {
        var match = val.match(RGBA_EXTRACT_REGEX);
        if (match) {
            r = +match[1];
            g = +match[2];
            b = +match[3];
            if (match[4])
                a = +match[4];
        }
    }
    return { r: r, g: g, b: b, a: a };
}
exports.parseColor = parseColor;
var FLOAT_COLOR_CACHE = {};
for (var htmlColor in data_1.HTML_COLORS) {
    FLOAT_COLOR_CACHE[htmlColor] = floatColor(data_1.HTML_COLORS[htmlColor]);
    // Replicating cache for hex values for free
    FLOAT_COLOR_CACHE[data_1.HTML_COLORS[htmlColor]] = FLOAT_COLOR_CACHE[htmlColor];
}
function rgbaToFloat(r, g, b, a, masking) {
    INT32[0] = (a << 24) | (b << 16) | (g << 8) | r;
    if (masking)
        INT32[0] = INT32[0] & 0xfeffffff;
    return FLOAT32[0];
}
exports.rgbaToFloat = rgbaToFloat;
function floatColor(val) {
    // The html color names are case-insensitive
    val = val.toLowerCase();
    // If the color is already computed, we yield it
    if (typeof FLOAT_COLOR_CACHE[val] !== "undefined")
        return FLOAT_COLOR_CACHE[val];
    var parsed = parseColor(val);
    var r = parsed.r, g = parsed.g, b = parsed.b;
    var a = parsed.a;
    a = (a * 255) | 0;
    var color = rgbaToFloat(r, g, b, a, true);
    FLOAT_COLOR_CACHE[val] = color;
    return color;
}
exports.floatColor = floatColor;
var FLOAT_INDEX_CACHE = {};
function indexToColor(index) {
    // If the index is already computed, we yield it
    if (typeof FLOAT_INDEX_CACHE[index] !== "undefined")
        return FLOAT_INDEX_CACHE[index];
    // To address issue #1397, one strategy is to keep encoding 4 bytes colors,
    // but with alpha hard-set to 1.0 (or 255):
    var r = (index & 0x00ff0000) >>> 16;
    var g = (index & 0x0000ff00) >>> 8;
    var b = index & 0x000000ff;
    var a = 0x000000ff;
    // The original 4 bytes color encoding was the following:
    // const r = (index & 0xff000000) >>> 24;
    // const g = (index & 0x00ff0000) >>> 16;
    // const b = (index & 0x0000ff00) >>> 8;
    // const a = index & 0x000000ff;
    var color = rgbaToFloat(r, g, b, a, true);
    FLOAT_INDEX_CACHE[index] = color;
    return color;
}
exports.indexToColor = indexToColor;
function colorToIndex(r, g, b, _a) {
    // As for the function indexToColor, because of #1397 and the "alpha is always
    // 1.0" strategy, we need to fix this function as well:
    return b + (g << 8) + (r << 16);
    // The original 4 bytes color decoding is the following:
    // return a + (b << 8) + (g << 16) + (r << 24);
}
exports.colorToIndex = colorToIndex;
/**
 * In sigma, the graph is normalized into a [0, 1], [0, 1] square, before being given to the various renderers. This
 * helps to deal with quadtree in particular.
 * But at some point, we need to rescale it so that it takes the best place in the screen, i.e. we always want to see two
 * nodes "touching" opposite sides of the graph, with the camera being at its default state.
 *
 * This function determines this ratio.
 */
function getCorrectionRatio(viewportDimensions, graphDimensions) {
    var viewportRatio = viewportDimensions.height / viewportDimensions.width;
    var graphRatio = graphDimensions.height / graphDimensions.width;
    // If the stage and the graphs are in different directions (such as the graph being wider that tall while the stage
    // is taller than wide), we can stop here to have indeed nodes touching opposite sides:
    if ((viewportRatio < 1 && graphRatio > 1) || (viewportRatio > 1 && graphRatio < 1)) {
        return 1;
    }
    // Else, we need to fit the graph inside the stage:
    // 1. If the graph is "squarer" (i.e. with a ratio closer to 1), we need to make the largest sides touch;
    // 2. If the stage is "squarer", we need to make the smallest sides touch.
    return Math.min(Math.max(graphRatio, 1 / graphRatio), Math.max(1 / viewportRatio, viewportRatio));
}
exports.getCorrectionRatio = getCorrectionRatio;
/**
 * Function returning a matrix from the current state of the camera.
 */
// TODO: it's possible to optimize this drastically!
function matrixFromCamera(state, viewportDimensions, graphDimensions, padding, inverse) {
    var angle = state.angle, ratio = state.ratio, x = state.x, y = state.y;
    var width = viewportDimensions.width, height = viewportDimensions.height;
    var matrix = (0, matrices_1.identity)();
    var smallestDimension = Math.min(width, height) - 2 * padding;
    var correctionRatio = getCorrectionRatio(viewportDimensions, graphDimensions);
    if (!inverse) {
        (0, matrices_1.multiply)(matrix, (0, matrices_1.scale)((0, matrices_1.identity)(), 2 * (smallestDimension / width) * correctionRatio, 2 * (smallestDimension / height) * correctionRatio));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.rotate)((0, matrices_1.identity)(), -angle));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.scale)((0, matrices_1.identity)(), 1 / ratio));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.translate)((0, matrices_1.identity)(), -x, -y));
    }
    else {
        (0, matrices_1.multiply)(matrix, (0, matrices_1.translate)((0, matrices_1.identity)(), x, y));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.scale)((0, matrices_1.identity)(), ratio));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.rotate)((0, matrices_1.identity)(), angle));
        (0, matrices_1.multiply)(matrix, (0, matrices_1.scale)((0, matrices_1.identity)(), width / smallestDimension / 2 / correctionRatio, height / smallestDimension / 2 / correctionRatio));
    }
    return matrix;
}
exports.matrixFromCamera = matrixFromCamera;
/**
 * All these transformations we apply on the matrix to get it rescale the graph
 * as we want make it very hard to get pixel-perfect distances in WebGL. This
 * function returns a factor that properly cancels the matrix effect on lengths.
 *
 * [jacomyal]
 * To be fully honest, I can't really explain happens here... I notice that the
 * following ratio works (i.e. it correctly compensates the matrix impact on all
 * camera states I could try):
 * > `R = size(V) / size(M * V) / W`
 * as long as `M * V` is in the direction of W (ie. parallel to (Ox)). It works
 * as well with H and a vector that transforms into something parallel to (Oy).
 *
 * Also, note that we use `angle` and not `-angle` (that would seem logical,
 * since we want to anticipate the rotation), because the image is vertically
 * swapped in WebGL.
 */
function getMatrixImpact(matrix, cameraState, viewportDimensions) {
    var _b = (0, matrices_1.multiplyVec2)(matrix, { x: Math.cos(cameraState.angle), y: Math.sin(cameraState.angle) }, 0), x = _b.x, y = _b.y;
    return 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) / viewportDimensions.width;
}
exports.getMatrixImpact = getMatrixImpact;
/**
 * Function extracting the color at the given pixel.
 */
function extractPixel(gl, x, y, array) {
    var data = array || new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return data;
}
exports.extractPixel = extractPixel;
/**
 * Check if the graph variable is a valid graph, and if sigma can render it.
 */
function validateGraph(graph) {
    // check if it's a valid graphology instance
    if (!(0, is_graph_1.default)(graph))
        throw new Error("Sigma: invalid graph instance.");
    // check if nodes have x/y attributes
    graph.forEachNode(function (key, attributes) {
        if (!Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) {
            throw new Error("Sigma: Coordinates of node ".concat(key, " are invalid. A node must have a numeric 'x' and 'y' attribute."));
        }
    });
}
exports.validateGraph = validateGraph;


/***/ }),

/***/ "./node_modules/sigma/utils/matrices.js":
/*!**********************************************!*\
  !*** ./node_modules/sigma/utils/matrices.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.multiplyVec2 = exports.multiply = exports.translate = exports.rotate = exports.scale = exports.identity = void 0;
function identity() {
    return Float32Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);
}
exports.identity = identity;
// TODO: optimize
function scale(m, x, y) {
    m[0] = x;
    m[4] = typeof y === "number" ? y : x;
    return m;
}
exports.scale = scale;
function rotate(m, r) {
    var s = Math.sin(r), c = Math.cos(r);
    m[0] = c;
    m[1] = s;
    m[3] = -s;
    m[4] = c;
    return m;
}
exports.rotate = rotate;
function translate(m, x, y) {
    m[6] = x;
    m[7] = y;
    return m;
}
exports.translate = translate;
function multiply(a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    var b00 = b[0], b01 = b[1], b02 = b[2];
    var b10 = b[3], b11 = b[4], b12 = b[5];
    var b20 = b[6], b21 = b[7], b22 = b[8];
    a[0] = b00 * a00 + b01 * a10 + b02 * a20;
    a[1] = b00 * a01 + b01 * a11 + b02 * a21;
    a[2] = b00 * a02 + b01 * a12 + b02 * a22;
    a[3] = b10 * a00 + b11 * a10 + b12 * a20;
    a[4] = b10 * a01 + b11 * a11 + b12 * a21;
    a[5] = b10 * a02 + b11 * a12 + b12 * a22;
    a[6] = b20 * a00 + b21 * a10 + b22 * a20;
    a[7] = b20 * a01 + b21 * a11 + b22 * a21;
    a[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return a;
}
exports.multiply = multiply;
function multiplyVec2(a, b, z) {
    if (z === void 0) { z = 1; }
    var a00 = a[0];
    var a01 = a[1];
    var a10 = a[3];
    var a11 = a[4];
    var a20 = a[6];
    var a21 = a[7];
    var b0 = b.x;
    var b1 = b.y;
    return { x: b0 * a00 + b1 * a10 + a20 * z, y: b0 * a01 + b1 * a11 + a21 * z };
}
exports.multiplyVec2 = multiplyVec2;


/***/ }),

/***/ "./node_modules/sigma/utils/picking.js":
/*!*********************************************!*\
  !*** ./node_modules/sigma/utils/picking.js ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPixelColor = void 0;
function getPixelColor(gl, frameBuffer, x, y, pixelRatio, downSizingRatio) {
    var bufferX = Math.floor((x / downSizingRatio) * pixelRatio);
    var bufferY = Math.floor(gl.drawingBufferHeight / downSizingRatio - (y / downSizingRatio) * pixelRatio);
    var pixel = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.readPixels(bufferX, bufferY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    var _a = __read(pixel, 4), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
    return [r, g, b, a];
}
exports.getPixelColor = getPixelColor;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const sigma_1 = __importDefault(__webpack_require__(/*! sigma */ "./node_modules/sigma/index.js"));
const graphology_1 = __importDefault(__webpack_require__(/*! graphology */ "./node_modules/graphology/dist/graphology.umd.min.js"));
// Instantiate sigma:
const graph = new graphology_1.default();
// Retrieve some useful DOM elements:
const container = document.getElementById("sigma-container");
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("suggestions");
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const minYearInput = document.getElementById("min-year");
const maxYearInput = document.getElementById("max-year");
const minYear = parseFloat(minYearInput.value);
const maxYear = parseFloat(maxYearInput.value);
const timerangeButton = document.getElementById("timerange-button");
function loadGraphDataAndPopulateSuggestions() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('data.json');
        const graphData = yield response.json();
        // Assume graph is an instance of your graph library initialized elsewhere
        graph.import(graphData); // Load your graph data into the graph instance
        // Now that the data is loaded, populate the datalist
        searchSuggestions.innerHTML = graph.nodes().map(node => {
            const label = graph.getNodeAttribute(node, "label");
            return `<option value="${label}"></option>`;
        }).join("\n");
    });
}
// Call the function to load data and populate suggestions
loadGraphDataAndPopulateSuggestions();
const renderer = new sigma_1.default(graph, container);
// configure renderer settings
renderer.setSetting("labelRenderedSizeThreshold", 5);
const languageOptions = new Set();
checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
        languageOptions.add(checkbox.value);
    }
});
// Declare application state
const state = { searchQuery: "",
    selectedLanguages: languageOptions,
    minYear: minYear,
    maxYear: maxYear };
// Actions:
function setSearchQuery(query) {
    state.searchQuery = query;
    if (searchInput.value !== query)
        searchInput.value = query;
    if (query) {
        const lcQuery = query.toLowerCase();
        const suggestions = graph
            .nodes()
            .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") }))
            .filter(({ label }) => label.toLowerCase().includes(lcQuery));
        // If we have a single perfect match, them we remove the suggestions, and
        // we consider the user has selected a node through the datalist
        // autocomplete:
        if (suggestions.length === 1 && suggestions[0].label === query) {
            state.selectedNode = suggestions[0].id;
            state.selectedNeighbors = new Set(graph.neighbors(state.selectedNode));
            state.suggestions = undefined;
            // Move the camera to center it on the selected node:
            const nodePosition = renderer.getNodeDisplayData(state.selectedNode);
            renderer.getCamera().animate(nodePosition, {
                duration: 500,
            });
        }
        // Else, we display the suggestions list:
        else {
            state.selectedNode = undefined;
            state.suggestions = new Set(suggestions.map(({ id }) => id));
        }
    }
    // If the query is empty, then we reset the selectedNode / suggestions state:
    else {
        state.selectedNode = undefined;
        state.suggestions = undefined;
        state.selectedNeighbors = undefined;
    }
    // Refresh rendering:
    renderer.refresh();
}
function setHoveredNode(node) {
    if (node) {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
    }
    else {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = undefined;
    }
    // Refresh rendering:
    renderer.refresh();
}
// Event listener for the apply button
timerangeButton.addEventListener("click", function () {
    // Get the values from the input elements
    const minYear = parseInt(minYearInput.value);
    const maxYear = parseInt(maxYearInput.value);
    state.minYear = minYear;
    state.maxYear = maxYear;
    // Use the values as needed in your JavaScript code
    console.log("Min Year:", minYear);
    console.log("Max Year:", maxYear);
    // For example, update the rendering based on the new year range
    renderer.refresh();
});
// // Function to handle input changes for both min and max year inputs
// function handleYearInputChange(event: Event) {
//   // Get the target input element that triggered the event
//   const targetInput = event.target as HTMLInputElement;
//   // Parse the input value as a number
//   const yearValue = parseFloat(targetInput.value);
//   // Update the appropriate state variable based on the input element's id
//   if (targetInput.id === "min-year") {
//     // Update min year state variable
//     state.minYear = yearValue;
//   } else if (targetInput.id === "max-year") {
//     // Update max year state variable
//     state.maxYear = yearValue;
//   }
// }
// Function to handle checkbox changes
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const language = checkbox.value;
    if (checkbox.checked) {
        // Checkbox is checked, add the language to selectedLanguages
        state.selectedLanguages.add(language);
    }
    else {
        // Checkbox is unchecked, remove the language from selectedLanguages
        state.selectedLanguages.delete(language);
    }
    renderer.refresh();
}
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleCheckboxChange);
});
// Function to handle the "Select All" and "Deselect All" buttons
function handleSelectAllDeselectAllClick(selectAll) {
    // Loop through checkboxes and set their checked state
    checkboxes.forEach((checkbox) => {
        const language = checkbox.value;
        checkbox.checked = selectAll;
        if (selectAll) {
            // If "Select All" is clicked, add all languages to selectedLanguages
            state.selectedLanguages.add(language);
        }
        else {
            // If "Deselect All" is clicked, remove all languages from selectedLanguages
            state.selectedLanguages.delete(language);
        }
    });
    renderer.refresh();
}
// Function to check if any neighbor of a node has a language attribute present in the given set
function hasNeighborWithLanguages(graph, nodeKey, languages = state.selectedLanguages) {
    return graph.someNeighbor(nodeKey, (neighbor, attributes) => {
        return languages.has(attributes.author_lang);
    });
}
// Attach event listeners to handle input changes for both min and max year inputs
//minYearInput.addEventListener("input", handleYearInputChange);
//maxYearInput.addEventListener("input", handleYearInputChange);
// Attach event listeners to checkboxes
// const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleCheckboxChange);
});
// Attach event listeners to "Select All" and "Deselect All" buttons
const selectAllButton = document.getElementById("select-all");
const deselectAllButton = document.getElementById("deselect-all");
selectAllButton === null || selectAllButton === void 0 ? void 0 : selectAllButton.addEventListener("click", () => {
    handleSelectAllDeselectAllClick(true);
});
deselectAllButton === null || deselectAllButton === void 0 ? void 0 : deselectAllButton.addEventListener("click", () => {
    handleSelectAllDeselectAllClick(false);
});
// Bind search input interactions:
searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value || "");
});
searchInput.addEventListener("blur", () => {
    setSearchQuery("");
});
// Bind graph interactions:
renderer.on("enterNode", ({ node }) => {
    if (!state.selectedNode && !state.selectedNeighbors) {
        setHoveredNode(node);
    }
});
renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
});
renderer.on("clickNode", ({ node }) => {
    state.selectedNode = node;
    state.selectedNeighbors = new Set(graph.neighbors(node));
    setHoveredNode(undefined);
});
renderer.on("clickStage", () => {
    state.selectedNode = undefined;
    state.selectedNeighbors = undefined;
    setHoveredNode(undefined);
});
renderer.setSetting("nodeReducer", (node, data) => {
    const res = Object.assign({}, data);
    // grey if the node's activity is outside the selected timerange
    if (data.activity_end < state.minYear || data.activity_start > state.maxYear) {
        res.label = "";
        res.color = "#f6f6f6";
    }
    // is the node hovered or neighbors a hovered node
    if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
        res.label = "";
        res.color = "#f6f6f6";
        // highlight is the node selected (by clicking or search)
    }
    else if (state.selectedNode === node) {
        res.highlighted = true;
        // grey if the node is in the selectedNeighbors set    
    }
    else if (state.selectedNeighbors && !state.selectedNeighbors.has(node)) {
        res.label = "";
        res.color = "#f6f6f6";
        // grey if the node's activity is outside the selected timerange
    }
    else if (data.activity_end < state.minYear || data.activity_start > state.maxYear) {
        res.label = "";
        res.color = "#f6f6f6";
        // grey if the suggestion box is open and the node is not suggested
    }
    else if (state.suggestions && !state.suggestions.has(node)) {
        res.label = "";
        res.color = "#f6f6f6";
        // grey if the node is filtered out with language selection box
    }
    else if (data.author_lang !== 'tlk' && !state.selectedLanguages.has(data.author_lang)) {
        res.label = "";
        res.color = "#f6f6f6";
        // grey out translators who are not connected to authors of filtered languages
    }
    else if (data.author_lang === 'tlk' && !hasNeighborWithLanguages(graph, node, state.selectedLanguages)) {
        res.label = "";
        res.color = "#f6f6f6";
    }
    return res;
});
renderer.setSetting("edgeReducer", (edge, data) => {
    const res = Object.assign({}, data);
    // grey if the node's activity is outside the selected timerange
    if (data.activity_end < state.minYear || data.activity_start > state.maxYear) {
        res.hidden = true;
    }
    // hide edge if nodes are not hovered
    if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
        res.hidden = true;
    }
    // hide edge if nodes are not selected
    else if (state.selectedNode && !graph.hasExtremity(edge, state.selectedNode)) {
        res.hidden = true;
    }
    // hide edge if nodes are not suggested
    else if (state.suggestions && (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))) {
        res.hidden = true;
    }
    // hide edge if nodes are not in selected languages
    else {
        const sourceNodeLanguage = graph.getNodeAttribute(graph.source(edge), "author_lang");
        const targetNodeLanguage = graph.getNodeAttribute(graph.target(edge), "author_lang");
        // Check if either the source or target node's language is in selectedLanguages
        if (!state.selectedLanguages.has(sourceNodeLanguage) &&
            !state.selectedLanguages.has(targetNodeLanguage)) {
            res.hidden = true;
        }
    }
    return res;
});
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.querySelector('.menu-button');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            console.log("clicked button");
            const panels = document.querySelectorAll('.small-panel');
            panels.forEach((panel) => {
                // Toggle a class that controls visibility
                panel.classList.toggle('is-visible');
            });
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const descriptionToggle = document.getElementById('description-toggle');
    const descriptionContent = document.getElementById('description-content');
    // Get all elements with class 'small-panel' and select the last one
    const allSmallPanels = Array.from(document.querySelectorAll('.small-panel'));
    const lastSmallPanel = allSmallPanels[allSmallPanels.length - 1];
    descriptionToggle === null || descriptionToggle === void 0 ? void 0 : descriptionToggle.addEventListener('click', () => {
        if (descriptionContent && descriptionContent instanceof HTMLElement) {
            if (descriptionContent.style.display === 'none') {
                descriptionContent.style.display = 'block';
                descriptionToggle.innerHTML = '<u><i>peida kirjeldus</i></u>';
                // Adjust the height of the last small panel here
                if (lastSmallPanel && lastSmallPanel instanceof HTMLElement) {
                    lastSmallPanel.style.maxHeight = 'calc(100vh - 20px - 650px)'; // Or any other value
                }
            }
            else {
                descriptionContent.style.display = 'none';
                descriptionToggle.innerHTML = '<u><i>näita kirjeldust</i></u>';
                // Reset the height of the last small panel here
                if (lastSmallPanel && lastSmallPanel instanceof HTMLElement) {
                    lastSmallPanel.style.maxHeight = 'calc(100vh - 20px - 350px)'; // Or any other initial value
                }
            }
        }
    });
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map