(function() {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-unused-vars */
var SyncPlay = {};
SyncPlay.util = {};
var ArrayHandlers = {
	get: function get(array, content) {
		if (typeof content == "string") {
			return array.find(function (itemFound) {
				return itemFound.name == content;
			});
		} else {
			if (array.includes(content)) {
				return content;
			} else {
				return undefined;
			}
		}
	},
	remove: function remove(array, content) {
		var index = void 0;
		if (typeof content == "string") {
			index = array.findIndex(function (itemFound) {
				return itemFound.name == content;
			});
		} else {
			index = array.indexOf(content);
		}
		if (index > -1) array.splice(index, 1);
	}
};

SyncPlay.util.ArrayHandlers = ArrayHandlers;

var EventEmitter = function () {
	function EventEmitter() {
		_classCallCheck(this, EventEmitter);

		this.eventList = {};
		this.activeEvents = true;
	}

	_createClass(EventEmitter, [{
		key: "on",
		value: function on(name, callback) {
			if (this.eventList[name] == null) {
				this.eventList[name] = [];
			}
			this.eventList[name].push(callback);
		}
	}, {
		key: "once",
		value: function once(name, callback) {
			var _this = this;

			var modifiedCallback = function modifiedCallback(data) {
				callback(data);
				_this.removeListener(name, modifiedCallback);
			};
			this.on(name, modifiedCallback);
		}
	}, {
		key: "any",
		value: function any(callback) {
			this.on("*", callback);
		}
	}, {
		key: "emit",
		value: function emit(name, data) {
			if (!this.activeEvents) return 0;
			if (!this.eventList[name]) return 0;

			for (var i = 0; i < this.eventList[name].length; i++) {
				this.eventList[name](data);
			}

			if (this.eventList["*"] && this.eventList["*"].length > 0) {
				for (var _i = 0; _i < this.eventList["*"].length; _i++) {
					this.eventList["*"](data);
				}
				return this.eventList[name].length + this.eventList["*"].length;
			} else {
				return this.eventList[name].length;
			}
		}
	}, {
		key: "removeListener",
		value: function removeListener(name, callback) {
			// TODO: find a way to gracefully report problems like this
			if (!this.eventList[name]) return;

			var index = this.eventList[name].indexOf(callback);
			if (index > -1) this.eventList.splice(index, 1);
		}
	}]);

	return EventEmitter;
}();

SyncPlay.util.EventEmitter = EventEmitter;
/* global EventEmitter */

var Protocol = function (_EventEmitter) {
	_inherits(Protocol, _EventEmitter);

	function Protocol(name) {
		_classCallCheck(this, Protocol);

		var _this2 = _possibleConstructorReturn(this, (Protocol.__proto__ || Object.getPrototypeOf(Protocol)).call(this));

		_this2.name = name;
		return _this2;
	}

	return Protocol;
}(EventEmitter);

SyncPlay.Protocol = Protocol;
/* global EventEmitter */
/* global ArrayHandlers */

var staticProtocolList = [];
var staticPlayerProxyList = [];

var Client = function (_EventEmitter2) {
	_inherits(Client, _EventEmitter2);

	function Client() {
		_classCallCheck(this, Client);

		var _this3 = _possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));

		_this3.protocolList = staticProtocolList;
		_this3.playerList = [];
		_this3.playerProxyList = staticPlayerProxyList;
		_this3.state = 0;
		return _this3;
	}

	_createClass(Client, [{
		key: "addProtocol",
		value: function addProtocol(protocol) {
			this.protocolList.push(protocol);
		}
	}, {
		key: "getProtocol",
		value: function getProtocol(protocol) {
			return ArrayHandlers.get(this.protocolList, protocol);
		}
	}, {
		key: "removeProtocol",
		value: function removeProtocol(protocol) {
			ArrayHandlers.remove(this.protocolList, protocol);
		}
	}, {
		key: "addPlayer",
		value: function addPlayer(player) {
			this.playerList.push(player);
		}
	}, {
		key: "getPlayer",
		value: function getPlayer(player) {
			return ArrayHandlers.get(this.playerList, player);
		}
	}, {
		key: "removePlayer",
		value: function removePlayer(player) {
			ArrayHandlers.remove(this.playerList, player);
		}
	}, {
		key: "addPlayerProxy",
		value: function addPlayerProxy(playerProxy) {
			this.playerProxyList.push(playerProxy);
		}
	}, {
		key: "getPlayerProxy",
		value: function getPlayerProxy(playerProxy) {
			return ArrayHandlers.get(this.playerProxyList, playerProxy);
		}
	}, {
		key: "removePlayerProxy",
		value: function removePlayerProxy(playerProxy) {
			ArrayHandlers.remove(this.playerProxyList, playerProxy);
		}
	}, {
		key: "connect",
		value: function connect(protocol, options) {
			var _this4 = this;

			if (this.state != 0) {
				throw new Error("Client is currently connected, must disconnect first before reconnecting.");
			}

			var fetchedProtocol = this.getProtocol(protocol);
			if (fetchedProtocol == undefined || !fetchedProtocol) {
				throw new Error("No protocol of that name is loaded!");
			}

			this.currentProtocol = fetchedProtocol;
			this.state = 1;

			fetchedProtocol.connect(options, function () {
				if (_this4.state != 1) {
					return; // ignore event if not in connecting state
				}
				_this4.state = 2;

				_this4.currentProtocol.any(_this4.proxyEvents);
				_this4.currentProtocol.on("seturl", _this4.setURL);
			});
		}
	}, {
		key: "proxyEvents",
		value: function proxyEvents(event, data) {
			for (var i = 0; i < this.playerProxyList; i++) {
				this.playerProxyList.on(event, data);
			}
			if (this.currentPlayer) {
				// players must not respond to seturl
				this.currentPlayer.on(event, data);
			}
		}
	}, {
		key: "proxyCommand",
		value: function proxyCommand(command, data) {
			if (this.currentPlayer) {
				for (var i = 0; i < this.playerProxyList; i++) {
					this.playerProxyList.command(command, data);
				}
				this.currentPlayer.command(command, data);
			} else {
				// TODO: maybe error if problematic?
			}
		}
	}, {
		key: "setURL",
		value: function setURL(url) {
			if (this.currentPlayer) {
				// TODO: what happens when a http player
				//       and yt player coexist? how do
				//       we choose which to use?
				if (this.currentPlayer.supports(url)) {
					this.proxyCommand("seturl", url);
					return;
				}
			}

			var foundPlayer = this.playerList.find(function (player) {
				return player.supports(url);
			});
			if (foundPlayer) {
				// if player is found, switch to it
				this.currentPlayer.command("terminate");
				this.currentPlayer = foundPlayer;
				this.proxyCommand("seturl", url);
			} else {
				// TODO: handle no players to play url
				//       catch-all player?
				throw new Error("No players to handle URL available");
			}
		}
	}], [{
		key: "addStaticProtocol",
		value: function addStaticProtocol(protocol) {
			staticProtocolList.push(protocol);
		}
	}, {
		key: "getStaticProtocol",
		value: function getStaticProtocol(protocol) {
			return ArrayHandlers.get(staticProtocolList, protocol);
		}
	}, {
		key: "removeStaticProtocol",
		value: function removeStaticProtocol(protocol) {
			ArrayHandlers.remove(staticProtocolList, protocol);
		}
	}, {
		key: "addStaticPlayerProxy",
		value: function addStaticPlayerProxy(playerProxy) {
			staticPlayerProxyList.push(playerProxy);
		}
	}, {
		key: "getStaticPlayerProxy",
		value: function getStaticPlayerProxy(playerProxy) {
			return ArrayHandlers.get(staticPlayerProxyList, playerProxy);
		}
	}, {
		key: "removeStaticPlayerProxy",
		value: function removeStaticPlayerProxy(playerProxy) {
			ArrayHandlers.remove(staticPlayerProxyList, playerProxy);
		}
	}]);

	return Client;
}(EventEmitter);

SyncPlay.Client = Client;
window.SyncPlay = SyncPlay;
}());

//# sourceMappingURL=syncplay.js.map
