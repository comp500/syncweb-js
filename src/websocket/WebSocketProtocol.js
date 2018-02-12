/* global EventEmitter */

class WebSocketProtocol extends EventEmitter {
	constructor() {
		super("WebSocket-builtin");

		this.currentPosition = 0.0;
		this.paused = true;
		this.doSeek = false;
		this.isReady = false;
		this.roomdetails = {};
		this.clientIgnoringOnTheFly = 0;
		this.serverIgnoringOnTheFly = 0;
	}

	// Public API

	connect(options, callback) {
		this.socket = new WebSocket(options.url);

		this.socket.addEventListener("open", () => {
			callback();
			if (options.password) {
				this.sendHello(options.name, options.room, options.password);
			} else {
				this.sendHello(options.name, options.room);
			}
			this.sendReady();
			this.sendListRequest();
			if (this.currentFile) {
				this.sendFile();
			}
		});

		this.socket.addEventListener("message", (e) => {
			this.emit("message", e.data);
			e.data.split("\n").forEach(messageText => {
				if (messageText == null) return;
				if (messageText.length < 1) return;
				this.parseMessage(messageText);
			});
		});
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
		}
	}

	sendData(data) {
		this.socket.send(JSON.stringify(data));
	}

	setTime(position) {
		this.currentPosition = position;
	}

	seekTo(position) {
		this.setTime(position);
		this.doSeek = true;
		this.sendState();
	}

	setPause(pause) {
		this.paused = pause;
		if (!pause && !this.isReady) {
			// potential problem: unpause is sent from video.play()
			// could result in unintentional ready setting
			this.isReady = true;
			this.sendReady();
		}
		this.sendState();
	}

	sendFile(duration, name) {
		if (name) {
			// TODO size attribute for non-html5 video players?
			// 0 means unknown duration
			if (!duration) duration = 0;
			this.currentFile = {duration, name, size: 0};
		}
		this.sendData({
			"Set": {
				file: this.currentFile
			}
		});
		this.sendListRequest();
	}

	sendReady(ready) {
		if (ready == undefined || ready == null) {
			ready = this.isReady;
		}
		let packet = {
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

	parseMessage(message) {
		let parsed = JSON.parse(message);
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

	parseError(data) {
		console.log("err", data); // eslint-disable-line no-console
		// TODO disconnect
	}

	parseHello(data) {
		console.log("hello", data); // eslint-disable-line no-console
		// TODO handle failed logins, etc.
		this.serverDetails = {
			version: data.version,
			realversion: data.realversion,
			features: data.features,
			motd: data.motd
		};
		let connectedString = `Connected to server, version ${data.version}.`;
		if (data.motd) {
			connectedString += ` MOTD:
			${data.motd}`;
		}
		this.emit("connected", connectedString);
		// roomEventRequest?
	}

	parseSet(data) {
		console.log("set", data); // eslint-disable-line no-console
		// TODO playlists
		if (data.user) {
			Object.keys(data.user).forEach((key) => {
				let user = data.user[key];
				if (user.event) {
					if (user.event.joined) {
						this.emit("joined", key);
						this.roomdetails[key] = {room: user.room.name};
					}
					if (user.event.left) {
						this.emit("left", key);
						delete this.roomdetails[key];
					}
				} else {
					if (this.roomdetails[key] && this.roomdetails[key].room != user.room.name) {
						// user has moved
						this.roomdetails[key].room = user.room.name;
						this.emit("moved", {"user": key, "room": user.room.name});
					}
				}
				if (user.file) {
					this.roomdetails[key].file = user.file;
				}
				this.emit("roomdetails", this.roomdetails);
			});
		}

		if (data.ready) {
			this.roomdetails[data.ready.username].isReady = data.ready.isReady;
			this.roomdetails[data.ready.username].manuallyInitiated = data.ready.manuallyInitiated;

			this.emit("roomdetails", this.roomdetails);
		}
	}

	parseList(data) {
		this.roomdetails = {};
		Object.keys(data).forEach((room) => {
			Object.keys(data[room]).forEach((user) => {
				this.roomdetails[user] = data[room][user];
				this.roomdetails[user].room = room;
			});
		});
		this.emit("roomdetails", data);
	}

	parseState(data) {
		if (data.ping.yourLatency != null) {
			this.clientRtt = data.ping.yourLatency;
		}
		this.latencyCalculation = data.ping.latencyCalculation;
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
		}
	}

	parseChat(data) {
		this.emit("chat", {
			name: data.username,
			message: data.message
		});
	}

	sendState() {
		let clientIgnoreIsNotSet = (this.clientIgnoringOnTheFly == 0 || this.serverIgnoringOnTheFly != 0);
		let output = {};
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

		if (this.stateChanged) { // TODO update this properly
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

	sendHello(username, room, password) {
		this.currentUsername = username;
		this.currentRoom = room;

		let packet = {
			"Hello": {
				username,
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

	sendListRequest() {
		this.sendData({"List": null});
	}
}

SyncWeb.Client = WebSocketProtocol;