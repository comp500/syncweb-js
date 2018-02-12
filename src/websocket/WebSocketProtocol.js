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

	event(event, data) {
		console.log("event: ", event, data); // eslint-disable-line no-console
		switch (event) {
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

	parseMessage(message) {
		let parsed = JSON.parse(message);
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
			let connectedString = `Connected to server, version ${parsed.Hello.version}.`;
			if (parsed.Hello.motd) {
				connectedString += ` MOTD:
				${parsed.Hello.motd}`;
			}
			this.emit("connected", connectedString);
			// roomEventRequest?
		}

		if (parsed.Set) {
			console.log("set", parsed.Set); // eslint-disable-line no-console
			// TODO playlists
			if (parsed.Set.user) {
				Object.keys(parsed.Set.user).forEach((key) => {
					let user = parsed.Set.user[key];
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

			if (parsed.Set.ready) {
				this.roomdetails[parsed.Set.ready.username].isReady = parsed.Set.ready.isReady;
				this.roomdetails[parsed.Set.ready.username].manuallyInitiated = parsed.Set.ready.manuallyInitiated;

				this.emit("roomdetails", this.roomdetails);
			}
		}

		if (parsed.List) {
			this.roomdetails = {};
			Object.keys(parsed.List).forEach((room) => {
				Object.keys(parsed.List[room]).forEach((user) => {
					this.roomdetails[user] = parsed.List[room][user];
					this.roomdetails[user].room = room;
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

		this.event("send", output);
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

		this.event("send", packet);
	}

	sendListRequest() {
		this.event("send", {"List": null});
	}

	sendReady() {
		let packet = {
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

	sendFile(duration, name) {
		if (name) {
			// TODO size attribute for non-html5 video players?
			// 0 means unknown duration
			if (!duration) duration = 0;
			this.currentFile = {duration, name, size: 0};
		}
		this.event("send", {
			"Set": {
				file: this.currentFile
			}
		});
		this.sendListRequest();
	}
}

SyncWeb.Client = WebSocketProtocol;