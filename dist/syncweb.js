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
/* global EventEmitter */

var WebSocketProtocol = function (_EventEmitter) {
	_inherits(WebSocketProtocol, _EventEmitter);

	function WebSocketProtocol() {
		_classCallCheck(this, WebSocketProtocol);

		var _this2 = _possibleConstructorReturn(this, (WebSocketProtocol.__proto__ || Object.getPrototypeOf(WebSocketProtocol)).call(this, "WebSocket-builtin"));

		_this2.currentPosition = 0.0;
		_this2.paused = true;
		_this2.doSeek = false;
		_this2.isReady = false;
		_this2.roomdetails = {};
		_this2.clientIgnoringOnTheFly = 0;
		_this2.serverIgnoringOnTheFly = 0;
		return _this2;
	}

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
			var _this4 = this;

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

				if (parsed.Set.ready) {
					this.roomdetails[parsed.Set.ready.username].isReady = parsed.Set.ready.isReady;
					this.roomdetails[parsed.Set.ready.username].manuallyInitiated = parsed.Set.ready.manuallyInitiated;

					this.emit("roomdetails", this.roomdetails);
				}
			}

			if (parsed.List) {
				this.roomdetails = {};
				Object.keys(parsed.List).forEach(function (room) {
					Object.keys(parsed.List[room]).forEach(function (user) {
						_this4.roomdetails[user] = parsed.List[room][user];
						_this4.roomdetails[user].room = room;
					});
				});
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
			if (name) {
				// TODO size attribute for non-html5 video players?
				// 0 means unknown duration
				if (!duration) duration = 0;
				this.currentFile = { duration: duration, name: name, size: 0 };
			}
			this.event("send", {
				"Set": {
					file: this.currentFile
				}
			});
			this.sendListRequest();
		}
	}]);

	return WebSocketProtocol;
}(EventEmitter);

SyncWeb.Client = WebSocketProtocol;
window.SyncWeb = SyncWeb;
}());

//# sourceMappingURL=syncweb.js.map
