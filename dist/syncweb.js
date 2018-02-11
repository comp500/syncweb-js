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
				totalList[i](name, data);
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

	_createClass(Protocol, [{
		key: "initialise",
		value: function initialise(client) {
			this.client = client;
		}
	}]);

	return Protocol;
}(EventEmitter);

SyncWeb.Protocol = Protocol;
/* global EventEmitter */

var Player = function (_EventEmitter2) {
	_inherits(Player, _EventEmitter2);

	function Player(name) {
		_classCallCheck(this, Player);

		var _this3 = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this));

		_this3.name = name;
		return _this3;
	}

	_createClass(Player, [{
		key: "initialise",
		value: function initialise(client) {
			this.client = client;
		}
	}]);

	return Player;
}(EventEmitter);

SyncWeb.Player = Player;

var PlayerProxy = function () {
	function PlayerProxy(name) {
		_classCallCheck(this, PlayerProxy);

		this.name = name;
	}

	_createClass(PlayerProxy, [{
		key: "initialise",
		value: function initialise(client) {
			this.client = client;
		}
	}]);

	return PlayerProxy;
}();

SyncWeb.PlayerProxy = PlayerProxy;
/* global EventEmitter, ArrayHandlers */

var staticProtocolList = [];
var staticPlayerProxyList = [];
var staticPlayerList = [];

var Client = function (_EventEmitter3) {
	_inherits(Client, _EventEmitter3);

	function Client(playerElement) {
		_classCallCheck(this, Client);

		var _this4 = _possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));

		_this4.protocolList = staticProtocolList;
		_this4.playerList = staticPlayerList;
		_this4.playerProxyList = staticPlayerProxyList;
		_this4.state = 0;
		_this4.playerElement = playerElement;

		_this4.playerList.forEach(function (player) {
			player.initialise(_this4);
		});

		_this4.playerProxyList.forEach(function (playerProxy) {
			playerProxy.initialise(_this4);
		});

		_this4.protocolList.forEach(function (protocol) {
			protocol.initialise(_this4);
		});
		return _this4;
	}

	_createClass(Client, [{
		key: "addProtocol",
		value: function addProtocol(protocol) {
			this.protocolList.push(protocol);
			protocol.initialise(this);
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
			player.initialise(this);
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
			playerProxy.initialise(this);
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
			var _this5 = this;

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
			fetchedProtocol.on("seturl", function (event, url) {
				_this5.setURL(url);
			});

			// TODO: implement some sort of log system, for errors, connection progress etc.

			fetchedProtocol.connect(options, function () {
				if (_this5.state != 1) {
					return; // ignore event if not in connecting state
				}
				_this5.state = 2;
				_this5.proxyEvents("connected");
			});
		}

		// events relay status, such as "connected", "connecting" etc.

	}, {
		key: "proxyEvents",
		value: function proxyEvents(event, data) {
			for (var i = 0; i < this.playerProxyList.length; i++) {
				this.playerProxyList[i].event(event, data);
			}
			if (this.currentPlayer) {
				// players must not respond to seturl??
				this.currentPlayer.event(event, data);
			}
		}
	}, {
		key: "proxyEventsToProtocol",
		value: function proxyEventsToProtocol(event, data) {
			for (var i = 0; i < this.playerProxyList.length; i++) {
				this.playerProxyList[i].event(event, data);
			}
			if (this.currentProtocol) {
				this.currentProtocol.event(event, data);
			}
		}
	}, {
		key: "setURL",
		value: function setURL(url) {
			// TODO: don't allow if not connected
			if (this.currentPlayer) {
				// TODO: what happens when a http player
				//       and yt player coexist? how do
				//       we choose which to use?
				if (this.currentPlayer.supports(url)) {
					this.proxyEvents("seturl", url);
					return;
				}
			}

			var foundPlayer = this.playerList.find(function (player) {
				return player.supports(url);
			});
			if (foundPlayer) {
				// if player is found, switch to it
				if (this.currentPlayer) this.currentPlayer.event("terminate");
				this.currentPlayer = foundPlayer;
				this.currentPlayer.any(this.proxyEventsToProtocol.bind(this));
				this.proxyEvents("seturl", url);
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

		var _this6 = _possibleConstructorReturn(this, (WebSocketProtocol.__proto__ || Object.getPrototypeOf(WebSocketProtocol)).call(this, "WebSocket-builtin"));

		_this6.currentPosition = 0.0;
		_this6.paused = true;
		_this6.doSeek = false;
		_this6.isReady = false;
		_this6.roomdetails = {};
		return _this6;
	}

	_createClass(WebSocketProtocol, [{
		key: "connect",
		value: function connect(options, callback) {
			var _this7 = this;

			this.socket = new WebSocket(options.url);

			this.socket.addEventListener("open", function () {
				callback();
				if (options.password) {
					_this7.sendHello(options.name, options.room, options.password);
				} else {
					_this7.sendHello(options.name, options.room);
				}
				_this7.sendReady();
				_this7.sendListRequest();
			});

			this.socket.addEventListener("message", function (e) {
				_this7.emit("message", e.data);
				e.data.split("\n").forEach(function (messageText) {
					if (messageText == null) return;
					if (messageText.length < 1) return;
					_this7.parseMessage(messageText);
				});
			});
		}
	}, {
		key: "event",
		value: function event(_event, data) {
			console.log("event: ", _event, data); // eslint-disable-line no-console
			switch (_event) {
				case "send":
					this.socket.send(JSON.stringify(data));
					break;
				case "setmeta":
					this.sendFile(data.duration, data.name);
					break;
				case "settime":
					this.currentPosition = data;
					break;
				case "seek":
					this.currentPosition = data;
					this.doSeek = true;
					this.sendState();
					break;
				case "pause":
					this.paused = true;
					this.sendState();
					break;
				case "unpause":
					this.paused = false;
					if (!this.isReady) {
						// potential problem: unpause is sent from video.play()
						// could result in unintentional ready setting
						this.isReady = true;
						this.sendReady();
					}
					this.sendState();
			}
		}
	}, {
		key: "parseMessage",
		value: function parseMessage(message) {
			var _this8 = this;

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
				// TODO playlists
				if (parsed.Set.user) {
					Object.keys(parsed.Set.user).forEach(function (key) {
						var user = parsed.Set.user[key];
						if (user.event) {
							if (user.event.joined) {
								_this8.emit("joined", key);
								if (!_this8.roomdetails[user.room.name]) {
									_this8.roomdetails[user.room.name] = {};
								}
								_this8.roomdetails[user.room.name][key] = {};
							}
							if (user.event.left) {
								_this8.emit("left", key);
								delete _this8.roomdetails[user.room.name][key];
								if (Object.keys(_this8.roomdetails[user.room.name]).length == 0) {
									delete _this8.roomdetails[user.room.name];
								}
							}
						} else {
							// eradicate all of this user
							var details = {};
							Object.keys(_this8.roomdetails).some(function (room) {
								return Object.keys(_this8.roomdetails[room]).some(function (foundUser) {
									if (foundUser == key) {
										details = _this8.roomdetails[room][foundUser];
										delete _this8.roomdetails[room][foundUser];
										if (Object.keys(_this8.roomdetails[room]).length == 0) {
											delete _this8.roomdetails[room];
										}
										return true;
									}
								});
							});
							if (!_this8.roomdetails[user.room.name]) {
								_this8.roomdetails[user.room.name] = {};
							}
							_this8.roomdetails[user.room.name][key] = details;
							_this8.emit("moved", { "user": key, "room": user.room.name });
						}
						_this8.emit("roomdetails", _this8.roomdetails);
					});
				}
			}

			if (parsed.List) {
				this.roomdetails = parsed.List;
				this.emit("roomdetails", parsed.List);
			}

			if (parsed.State) {
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
						if (parsed.State.playstate.doSeek && !this.doSeek) {
							this.emit("seek", parsed.State.playstate.position);
						}
						if (this.paused != parsed.State.playstate.paused) {
							if (parsed.State.playstate.paused) {
								this.emit("pause");
								this.paused = true;
							} else {
								this.emit("unpause");
								this.paused = false;
							}
						}
					}
				}
			}

			if (parsed.Chat) {
				this.emit("chat", {
					name: parsed.Chat.username,
					message: parsed.Chat.message
				});
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
				if (this.doSeek) {
					output.State.playstate.doSeek = true;
					this.doSeek = false;
				}
			}

			output.State.ping = {};
			output.State.ping.latencyCalculation = this.latencyCalculation;
			output.State.ping.clientLatencyCalculation = Date.now() / 1000;
			output.State.ping.clientRtt = this.clientRtt;

			if (this.stateChanged) {
				// TODO update this properly
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

			this.event("send", output);
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

			this.event("send", packet);
		}
	}, {
		key: "sendListRequest",
		value: function sendListRequest() {
			this.event("send", { "List": null });
		}
	}, {
		key: "sendReady",
		value: function sendReady() {
			var packet = {
				"Set": {
					"ready": {
						isReady: this.isReady,
						manuallyInitiated: true,
						username: this.currentUsername
					}
				}
			};
			this.event("send", packet);
		}
	}, {
		key: "sendFile",
		value: function sendFile(duration, name) {
			// TODO size attribute for non-html5 video players?
			// 0 means unknown duration
			if (!duration) duration = 0;
			var file = { duration: duration, name: name, size: 0 };
			this.event("send", {
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
