(function() {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-unused-vars */
var SyncWeb = {};
SyncWeb.util = {};
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

SyncWeb.util.ArrayHandlers = ArrayHandlers;

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

			var totalList = void 0;
			if (this.eventList[name] && this.eventList["*"]) {
				totalList = this.eventList[name].concat(this.eventList["*"]);
			} else if (this.eventList[name]) {
				totalList = this.eventList[name];
			} else if (this.eventList["*"]) {
				totalList = this.eventList["*"];
			} else {
				return 0;
			}

			for (var i = 0; i < totalList.length; i++) {
				totalList[i](data);
			}

			return totalList.length;
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

SyncWeb.util.EventEmitter = EventEmitter;
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

SyncWeb.Protocol = Protocol;

var Player = function Player(name) {
	_classCallCheck(this, Player);

	this.name = name;
};

SyncWeb.Player = Player;

var PlayerProxy = function PlayerProxy(name) {
	_classCallCheck(this, PlayerProxy);

	this.name = name;
};

SyncWeb.PlayerProxy = PlayerProxy;
/* global EventEmitter, ArrayHandlers */

var staticProtocolList = [];
var staticPlayerProxyList = [];
var staticPlayerList = [];

var Client = function (_EventEmitter2) {
	_inherits(Client, _EventEmitter2);

	function Client() {
		_classCallCheck(this, Client);

		var _this3 = _possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));

		_this3.protocolList = staticProtocolList;
		_this3.playerList = staticPlayerList;
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
				// TODO: general error handler instead of throwing errors?
				throw new Error("Client is currently connected, must disconnect first before reconnecting.");
			}

			var fetchedProtocol = this.getProtocol(protocol);
			if (fetchedProtocol == undefined || !fetchedProtocol) {
				throw new Error("No protocol of that name is loaded!");
			}

			this.currentProtocol = fetchedProtocol;
			this.state = 1;

			this.proxyEvents("connecting", protocol);
			fetchedProtocol.any(this.proxyEvents.bind(this));
			fetchedProtocol.on("seturl", this.setURL.bind(this));

			// TODO: implement some sort of log system, for errors, connection progress etc.

			fetchedProtocol.connect(options, function () {
				if (_this4.state != 1) {
					return; // ignore event if not in connecting state
				}
				_this4.state = 2;
				_this4.proxyEvents("connected");
			});
		}

		// events relay status, such as "connected", "connecting" etc.

	}, {
		key: "proxyEvents",
		value: function proxyEvents(event, data) {
			for (var i = 0; i < this.playerProxyList.length; i++) {
				this.playerProxyList[i].on(event, data);
			}
			if (this.currentPlayer) {
				// players must not respond to seturl
				this.currentPlayer.on(event, data);
			}
		}

		// commands relay information about change of state, e.g. protocol tells player to pause

	}, {
		key: "proxyCommand",
		value: function proxyCommand(command, data) {
			if (this.currentPlayer) {
				for (var i = 0; i < this.playerProxyList.length; i++) {
					this.playerProxyList[i].command(command, data);
				}
				this.currentPlayer.command(command, data);
			} else {
				// TODO: maybe error if problematic?
			}
		}
	}, {
		key: "proxyCommandToProtocol",
		value: function proxyCommandToProtocol(command, data) {
			// TODO: Should players emit (and have proxied) events?
			if (this.currentPlayer) {
				for (var i = 0; i < this.playerProxyList.length; i++) {
					this.playerProxyList[i].command(command, data);
				}
				this.currentProtocol.command(command, data);
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
				if (this.currentPlayer) this.currentPlayer.command("terminate");
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
		key: "addStaticPlayer",
		value: function addStaticPlayer(player) {
			staticPlayerList.push(player);
		}
	}, {
		key: "getStaticPlayer",
		value: function getStaticPlayer(player) {
			return ArrayHandlers.get(staticPlayerList, player);
		}
	}, {
		key: "removeStaticPlayer",
		value: function removeStaticPlayer(player) {
			ArrayHandlers.remove(staticPlayerList, player);
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

SyncWeb.Client = Client;

var WebSocketProtocol = function (_SyncWeb$Protocol) {
	_inherits(WebSocketProtocol, _SyncWeb$Protocol);

	function WebSocketProtocol() {
		_classCallCheck(this, WebSocketProtocol);

		var _this5 = _possibleConstructorReturn(this, (WebSocketProtocol.__proto__ || Object.getPrototypeOf(WebSocketProtocol)).call(this, "WebSocket-builtin"));

		_this5.currentPosition = 0.0;
		_this5.paused = true;
		return _this5;
	}

	_createClass(WebSocketProtocol, [{
		key: "connect",
		value: function connect(options, callback) {
			var _this6 = this;

			this.socket = new WebSocket(options.url);

			this.socket.addEventListener("open", function () {
				callback();
				_this6.sendHello("comp500", "test");
			});

			this.socket.addEventListener("message", function (e) {
				_this6.emit("message", e.data);
				e.data.split("\n").forEach(function (messageText) {
					if (messageText == null) return;
					if (messageText.length < 1) return;
					_this6.parseMessage(messageText);
				});
			});
		}
	}, {
		key: "command",
		value: function command(_command, data) {
			if (_command == "send") {
				this.socket.send(JSON.stringify(data));
			}
		}
	}, {
		key: "parseMessage",
		value: function parseMessage(message) {
			var parsed = JSON.parse(message);
			console.log("SERVER:", parsed); // eslint-disable-line no-console

			if (parsed.Error) {
				console.log("err", parsed.Error); // eslint-disable-line no-console
				// TODO disconnect
			}

			if (parsed.Hello) {
				console.log("hello", parsed.Hello); // eslint-disable-line no-console
				// TODO handle failed logins, etc.
				this.serverDetails = {
					version: parsed.Hello.version,
					realversion: parsed.Hello.realversion,
					features: parsed.Hello.features,
					motd: parsed.Hello.motd
				};
				var connectedString = "Connected to server, version " + parsed.Hello.version + ".";
				if (parsed.Hello.motd) {
					connectedString += " MOTD:\n\t\t\t\t" + parsed.Hello.motd;
				}
				this.emit("connected", connectedString);
				// roomEventRequest?
			}

			if (parsed.Set) {
				console.log("set", parsed.Set); // eslint-disable-line no-console
				// TODO users, playlists
			}

			if (parsed.List) {
				console.log("list", parsed.List); // eslint-disable-line no-console
				console.log("roomsList", Object.keys(parsed.List)); // eslint-disable-line no-console
				console.log("userList", Object.keys(parsed.List[this.currentRoom])); // eslint-disable-line no-console
			}

			if (parsed.State) {
				console.log("state", parsed.State); // eslint-disable-line no-console
				if (parsed.State.ping.yourLatency != null) {
					this.clientRtt = parsed.State.ping.yourLatency;
				}
				this.latencyCalculation = parsed.State.ping.latencyCalculation;
				if (parsed.State.ignoringOnTheFly && parsed.State.ignoringOnTheFly.server) {
					this.serverIgnoringOnTheFly = parsed.State.ignoringOnTheFly.server;
					this.clientIgnoringOnTheFly = 0;
					this.stateChanged = false;
				}
				if (parsed.State.playstate) {
					if (parsed.State.playstate.setBy && parsed.State.playstate.setBy != this.currentUsername) {
						var doSeek = parsed.State.playstate.doSeek;
						// falsy -> false, because null/undefined
						if (!doSeek) doSeek = false;
						console.log({ // eslint-disable-line no-console
							setBy: parsed.State.playstate.setBy,
							paused: parsed.State.playstate.paused,
							position: parsed.State.playstate.position,
							doSeek: doSeek
						});

						this.paused = parsed.State.playstate.paused;
						this.currentPosition = parsed.State.playstate.position;
					}
				}
			}
			this.sendState();
		}
	}, {
		key: "sendState",
		value: function sendState() {
			var clientIgnoreIsNotSet = this.clientIgnoringOnTheFly == 0 || this.serverIgnoringOnTheFly != 0;
			var output = {};
			output.State = {};

			if (clientIgnoreIsNotSet) {
				output.State.playstate = {};
				output.State.playstate.position = this.currentPosition;
				output.State.playstate.paused = this.paused;
				// if seek, send doSeek: true and then set seek to false
			}

			output.State.ping = {};
			output.State.ping.latencyCalculation = this.latencyCalculation;
			output.State.ping.clientLatencyCalculation = Date.now() / 1000;
			output.State.ping.clientRtt = this.clientRtt;

			if (this.stateChanged) {
				this.clientIgnoringOnTheFly += 1;
			}

			if (this.serverIgnoringOnTheFly > 0 || this.clientIgnoringOnTheFly > 0) {
				output.State.ignoringOnTheFly = {};
				if (this.serverIgnoringOnTheFly > 0) {
					output.State.ignoringOnTheFly.server = this.serverIgnoringOnTheFly;
					this.serverIgnoringOnTheFly = 0;
				}
				if (this.clientIgnoringOnTheFly > 0) {
					output.State.ignoringOnTheFly.client = this.clientIgnoringOnTheFly;
				}
			}

			console.log(output); // eslint-disable-line no-console

			this.command("send", output);
		}
	}, {
		key: "sendHello",
		value: function sendHello(username, room, password) {
			this.currentUsername = username;
			this.currentRoom = room;

			var packet = {
				"Hello": {
					username: username,
					"room": {
						name: room
					},
					"version": "1.5.1"
				}
			};

			if (password) {
				packet.Hello.password = password;
			}

			this.command("send", packet);
		}
	}, {
		key: "sendListRequest",
		value: function sendListRequest() {
			this.command("send", { "List": null });
		}
	}, {
		key: "sendReady",
		value: function sendReady(ready) {
			var packet = {
				"Set": {
					"ready": {
						isReady: ready,
						manuallyInitiated: true,
						username: this.currentUsername
					}
				}
			};
			this.command("send", packet);
		}
	}, {
		key: "sendFile",
		value: function sendFile() {
			var file = { "duration": 60.534, "name": "test.mkv", "size": 6302151 };
			this.command("send", {
				"Set": {
					file: file
				}
			});
		}
	}]);

	return WebSocketProtocol;
}(SyncWeb.Protocol);

// Adds the protocol to SyncWeb statically, so every Client has it


SyncWeb.Client.addStaticProtocol(new WebSocketProtocol());
window.SyncWeb = SyncWeb;
}());

//# sourceMappingURL=syncweb.js.map
