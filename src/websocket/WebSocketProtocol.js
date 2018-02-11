class WebSocketProtocol extends SyncWeb.Protocol {
	constructor() {
		super("WebSocket-builtin");

		this.currentPosition = 0.0;
		this.paused = true;
		this.doSeek = false;
	}

	connect(options, callback) {
		this.socket = new WebSocket(options.url);

		this.socket.addEventListener("open", () => {
			callback();
			this.sendHello("comp500", "test");
			this.sendReady(false);
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

	command(command, data) {
		console.log("command: ", command, data); // eslint-disable-line no-console
		if (command == "send") {
			this.socket.send(JSON.stringify(data));
		}
		if (command == "setmeta") {
			this.sendFile(data.duration, data.name);
		}
		if (command == "settime") {
			this.currentPosition = data;
		}
		if (command == "seek") {
			this.currentPosition = data;
			this.doSeek = true;
			this.sendState();
		}
		if (command == "pause") {
			this.paused = true;
			this.sendState();
		}
		if (command == "unpause") {
			this.paused = false;
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
			// TODO users, playlists
		}

		if (parsed.List) {
			console.log("list", parsed.List); // eslint-disable-line no-console
			console.log("roomsList", Object.keys(parsed.List)); // eslint-disable-line no-console
			console.log("userList", Object.keys(parsed.List[this.currentRoom])); // eslint-disable-line no-console
		}

		if (parsed.State) {
			//console.log("state", parsed.State); // eslint-disable-line no-console
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
					let doSeek = parsed.State.playstate.doSeek;
					// falsy -> false, because null/undefined
					if (!doSeek) doSeek = false;
					/*console.log({ // eslint-disable-line no-console
						setBy: parsed.State.playstate.setBy,
						paused: parsed.State.playstate.paused,
						position: parsed.State.playstate.position,
						doSeek
					});*/

					//this.currentPosition = parsed.State.playstate.position;
					if (doSeek && !this.doSeek) {
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

		this.command("send", packet);
	}

	sendListRequest() {
		this.command("send", {"List": null});
	}

	sendReady(ready) {
		let packet = {
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

	sendFile(duration, name) {
		// TODO size attribute for non-html5 video players?
		let file = {duration, name, size: 0};
		this.command("send", {
			"Set": {
				file
			}
		});
	}
}

// Adds the protocol to SyncWeb statically, so every Client has it
SyncWeb.Client.addStaticProtocol(new WebSocketProtocol());