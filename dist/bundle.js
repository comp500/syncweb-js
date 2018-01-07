/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _class =
/*#__PURE__*/
function () {
  function _class(writer) {
    _classCallCheck(this, _class);

    this.writer = writer;
  }

  _createClass(_class, [{
    key: "seek",
    value: function seek(position) {
      this.writer(JSON.stringify({
        "seekto": position
      }));
    }
  }]);

  return _class;
}();

exports.default = _class;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _class =
/*#__PURE__*/
function () {
  function _class() {
    _classCallCheck(this, _class);

    this.errorcallbacks = [];
  }

  _createClass(_class, [{
    key: "write",
    value: function write(message) {
      var messageParsed = JSON.parse(message);

      if (messageParsed.length > 0) {
        this.errorcallbacks.forEach(function (callback) {
          return callback("seek", 55);
        });
      }
    }
  }, {
    key: "onMessage",
    value: function onMessage(callback) {
      this.errorcallbacks.push(callback);
    }
  }]);

  return _class;
}();

exports.default = _class;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Client = _interopRequireDefault(__webpack_require__(3));

var _Serializer = _interopRequireDefault(__webpack_require__(0));

var _Deserializer = _interopRequireDefault(__webpack_require__(1));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global SYNCPLAYEXPORT */
var SyncPlay = {};
SyncPlay.Client = _Client.default;
SyncPlay.Serializer = _Serializer.default;
SyncPlay.Deserializer = _Deserializer.default;
var _default = SyncPlay;
exports.default = _default;

if (true) {
  window.SyncPlay = SyncPlay;
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Serializer = _interopRequireDefault(__webpack_require__(0));

var _Deserializer = _interopRequireDefault(__webpack_require__(1));

var _WebSocketConnection = _interopRequireDefault(__webpack_require__(4));

var _PingResponder = _interopRequireDefault(__webpack_require__(5));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _class =
/*#__PURE__*/
function () {
  function _class(callback) {
    _classCallCheck(this, _class);

    console.log("Constructed!");
    this.eventHandler = callback;
    this.errorcallbacks = [];
  }

  _createClass(_class, [{
    key: "connect",
    value: function () {
      var _connect = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(path) {
        var _this = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.connection = new _WebSocketConnection.default();
                _context.next = 3;
                return this.connection.connect(path);

              case 3:
                this.serializer = new _Serializer.default(function (stringToWrite) {
                  _this.connection.write(stringToWrite);
                });
                this.deserializer = new _Deserializer.default();
                this.deserializer.onMessage(this.eventHandler);
                this.connection.onMessage(function (msg) {
                  try {
                    _this.deserializer.write(msg);
                  } catch (e) {
                    _this.errorcallbacks.forEach(function (callback) {
                      return callback(e);
                    });
                  }
                });
                this.connection.onError(function (e) {
                  _this.errorcallbacks.forEach(function (callback) {
                    return callback(e);
                  });
                });
                this.pingresponder = new _PingResponder.default(this.serializer, this.deserializer);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function connect(_x) {
        return _connect.apply(this, arguments);
      };
    }()
  }, {
    key: "close",
    value: function close() {
      try {
        this.connection.close();
        this.pingresponder.close(); // free memory?

        delete this.connection;
        delete this.serializer;
        delete this.deserializer;
        delete this.pingresponder;
      } catch (e) {// ignore as already closed
      }
    }
  }, {
    key: "getState",
    value: function getState() {
      if (this.connection) {
        this.connection.getState();
      } else {
        return -1;
      }
    }
  }, {
    key: "onError",
    value: function onError(callback) {
      this.errorcallbacks.push(callback);
    }
  }]);

  return _class;
}();

exports.default = _class;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _class =
/*#__PURE__*/
function () {
  function _class() {
    _classCallCheck(this, _class);

    console.log("Constructed WSConn!");
  }

  _createClass(_class, [{
    key: "connect",
    value: function connect(path) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.socket = new WebSocket(path);

        var errorListener = function errorListener(e) {
          reject(e);
        };

        _this.socket.addEventListener("open", function () {
          resolve();

          _this.socket.removeEventListener("open", errorListener);
        });

        _this.socket.addEventListener("error", errorListener);
      });
    }
  }, {
    key: "write",
    value: function write(msg) {
      this.socket.send(msg);
    }
  }, {
    key: "onMessage",
    value: function onMessage(callback) {
      this.socket.addEventListener("message", function (event) {
        callback(event.data);
      });
    }
  }, {
    key: "onError",
    value: function onError(callback) {
      this.socket.addEventListener("error", function (e) {
        callback(e);
      });
    }
  }, {
    key: "close",
    value: function close() {
      this.socket.close();
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.socket.readyState;
    }
  }]);

  return _class;
}();

exports.default = _class;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _class =
/*#__PURE__*/
function () {
  function _class(serializer, deserializer) {
    _classCallCheck(this, _class);

    this.serializer = serializer;
    this.deserializer = deserializer;
    this.deserializer.onMessage(this.handleEvent);
  }

  _createClass(_class, [{
    key: "handleEvent",
    value: function handleEvent(event, data) {
      // there, eslint. i used it.
      event;
      data;
    }
  }, {
    key: "close",
    value: function close() {}
  }]);

  return _class;
}();

exports.default = _class;

/***/ })
/******/ ]);