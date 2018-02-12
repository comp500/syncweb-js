(function() {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable no-unused-vars */
var SyncWeb = {};
SyncWeb.util = {};

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
/* global EventEmitter, PingService */

var WebSocketProtocol = function (_EventEmitter) {
	_inherits(WebSocketProtocol, _EventEmitter);

	function WebSocketProtocol() {
		_classCallCheck(this, WebSocketProtocol);

		var _this2 = _possibleConstructorReturn(this, (WebSocketProtocol.__proto__ || Object.getPrototypeOf(WebSocketProtocol)).call(this, "WebSocket-builtin"));

		_this2.currentPosition = 0;
		_this2.paused = true;
		_this2.doSeek = false;
		_this2.isReady = false;
		_this2.roomdetails = {};
		_this2.clientIgnoringOnTheFly = 0;
		_this2.serverIgnoringOnTheFly = 0;
		_this2.pingService = new PingService();
		_this2.serverPosition = 0;
		return _this2;
	}

	// Public API

	_createClass(WebSocketProtocol, [{
		key: "connect",
		value: function connect(options, callback) {
			var _this3 = this;

			this.socket = new WebSocket(options.url);

			this.socket.addEventListener("open", function () {
				callback();
				if (options.password) {
					_this3.sendHello(options.name, options.room, options.password);
				} else {
					_this3.sendHello(options.name, options.room);
				}
				_this3.sendReady();
				_this3.sendListRequest();
				if (_this3.currentFile) {
					_this3.sendFile();
				}
			});

			this.socket.addEventListener("message", function (e) {
				_this3.emit("message", e.data);
				e.data.split("\n").forEach(function (messageText) {
					if (messageText == null) return;
					if (messageText.length < 1) return;
					_this3.parseMessage(messageText);
				});
			});
		}
	}, {
		key: "disconnect",
		value: function disconnect() {
			if (this.socket) {
				this.socket.close();
			}
		}
	}, {
		key: "sendData",
		value: function sendData(data) {
			this.socket.send(JSON.stringify(data));
		}
	}, {
		key: "setTime",
		value: function setTime(position) {
			this.currentPosition = position;
		}
	}, {
		key: "seekTo",
		value: function seekTo(position) {
			this.setTime(position);
			this.doSeek = true;
			this.sendState();
		}
	}, {
		key: "setPause",
		value: function setPause(pause) {
			this.paused = pause;
			if (!pause && !this.isReady) {
				// potential problem: unpause is sent from video.play()
				// could result in unintentional ready setting
				this.isReady = true;
				this.sendReady();
			}
			this.sendState();
		}
	}, {
		key: "sendFile",
		value: function sendFile(duration, name) {
			if (name) {
				// TODO size attribute for non-html5 video players?
				// 0 means unknown duration
				if (!duration) duration = 0;
				this.currentFile = { duration: duration, name: name, size: 0 };
			}
			this.sendData({
				"Set": {
					file: this.currentFile
				}
			});
			this.sendListRequest();
		}
	}, {
		key: "sendReady",
		value: function sendReady(ready) {
			if (ready == undefined || ready == null) {
				ready = this.isReady;
			}
			var packet = {
				"Set": {
					"ready": {
						isReady: ready,
						manuallyInitiated: true,
						username: this.currentUsername
					}
				}
			};
			this.sendData(packet);
		}

		// Private API

	}, {
		key: "parseMessage",
		value: function parseMessage(message) {
			var parsed = JSON.parse(message);
			console.log("SERVER:", parsed); // eslint-disable-line no-console

			if (parsed.Error) {
				this.parseError(parsed.Error);
			}
			if (parsed.Hello) {
				this.parseHello(parsed.Hello);
			}
			if (parsed.Set) {
				this.parseSet(parsed.Set);
			}
			if (parsed.List) {
				this.parseList(parsed.List);
			}
			if (parsed.State) {
				this.parseState(parsed.State);
			}
			if (parsed.Chat) {
				this.parseChat(parsed.Chat);
			}

			this.sendState();
		}
	}, {
		key: "parseError",
		value: function parseError(data) {
			console.log("err", data); // eslint-disable-line no-console
			// TODO disconnect
		}
	}, {
		key: "parseHello",
		value: function parseHello(data) {
			console.log("hello", data); // eslint-disable-line no-console
			// TODO handle failed logins, etc.
			this.serverDetails = {
				version: data.version,
				realversion: data.realversion,
				features: data.features,
				motd: data.motd
			};
			var connectedString = "Connected to server, version " + data.version + ".";
			if (data.motd) {
				connectedString += " MOTD:\n\t\t\t" + data.motd;
			}
			this.emit("connected", connectedString);
			// roomEventRequest?
		}
	}, {
		key: "parseSet",
		value: function parseSet(data) {
			var _this4 = this;

			console.log("set", data); // eslint-disable-line no-console
			// TODO playlists
			if (data.user) {
				Object.keys(data.user).forEach(function (key) {
					var user = data.user[key];
					if (user.event) {
						if (user.event.joined) {
							_this4.emit("joined", key);
							_this4.roomdetails[key] = { room: user.room.name };
						}
						if (user.event.left) {
							_this4.emit("left", key);
							delete _this4.roomdetails[key];
						}
					} else {
						if (_this4.roomdetails[key] && _this4.roomdetails[key].room != user.room.name) {
							// user has moved
							_this4.roomdetails[key].room = user.room.name;
							_this4.emit("moved", { "user": key, "room": user.room.name });
						}
					}
					if (user.file) {
						_this4.roomdetails[key].file = user.file;
					}
					_this4.emit("roomdetails", _this4.roomdetails);
				});
			}

			if (data.ready) {
				this.roomdetails[data.ready.username].isReady = data.ready.isReady;
				this.roomdetails[data.ready.username].manuallyInitiated = data.ready.manuallyInitiated;

				this.emit("roomdetails", this.roomdetails);
			}

			// to implement:
			// room, controllerAuth, newControlledRoom, playlistIndex, playlistChange
		}
	}, {
		key: "parseList",
		value: function parseList(data) {
			var _this5 = this;

			this.roomdetails = {};
			Object.keys(data).forEach(function (room) {
				Object.keys(data[room]).forEach(function (user) {
					_this5.roomdetails[user] = data[room][user];
					_this5.roomdetails[user].room = room;
				});
			});
			this.emit("roomdetails", data);
		}
	}, {
		key: "parseState",
		value: function parseState(data) {
			var messageAge = 0;
			if (data.ignoringOnTheFly && data.ignoringOnTheFly.server) {
				this.serverIgnoringOnTheFly = data.ignoringOnTheFly.server;
				this.clientIgnoringOnTheFly = 0;
				this.stateChanged = false;
			}
			if (data.playstate) {
				if (data.playstate.setBy && data.playstate.setBy != this.currentUsername) {
					if (data.playstate.doSeek && !this.doSeek) {
						this.emit("seek", data.playstate.position);
					}
					if (this.paused != data.playstate.paused) {
						if (data.playstate.paused) {
							this.emit("pause");
							this.paused = true;
						} else {
							this.emit("unpause");
							this.paused = false;
						}
					}
				}
				if (data.playstate.position) {
					this.serverPosition = data.playstate.position;
				}
			}
			if (data.ping) {
				if (data.ping.latencyCalculation) {
					this.latencyCalculation = data.ping.latencyCalculation;
				}
				if (data.ping.clientLatencyCalculation) {
					this.pingService.receiveMessage(data.ping.clientLatencyCalculation, data.ping.serverRtt);
				}
				messageAge = this.pingService.getLastForwardDelay();
			}

			// update position due to message delays
			if (!this.paused) {
				this.serverPosition += messageAge;
			}

			// compare server position and client position, ffwd/rewind etc.
		}
	}, {
		key: "parseChat",
		value: function parseChat(data) {
			this.emit("chat", {
				name: data.username,
				message: data.message
			});
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
			if (this.latencyCalculation) {
				output.State.ping.latencyCalculation = this.latencyCalculation;
			}
			output.State.ping.clientLatencyCalculation = Date.now() / 1000;
			output.State.ping.clientRtt = this.pingService.getRTT();

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

			this.sendData(output);
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

			this.sendData(packet);
		}
	}, {
		key: "sendListRequest",
		value: function sendListRequest() {
			this.sendData({ "List": null });
		}
	}]);

	return WebSocketProtocol;
}(EventEmitter);

SyncWeb.Client = WebSocketProtocol;
window.SyncWeb = SyncWeb;
}());

//# sourceMappingURL=syncweb.js.map
