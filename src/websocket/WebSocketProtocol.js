class WebSocketProtocol extends SyncWeb.Protocol {
	constructor() {
		super("WebSocket-builtin");
	}

	connect(options, callback) {
		this.socket = new WebSocket(options.url);

		this.socket.addEventListener("open", () => {
			callback();
		});

		this.socket.addEventListener("message", (e) => {
			this.emit("message", e.data);
			e.data.split("\n").forEach(messageText => {
				this.parseMessage(messageText);
			});
		});
	}

	command(command, data) {
		if (command == "send") {
			this.socket.send(JSON.stringify(data));
		}
	}

	parseMessage(message) {
		let parsed = JSON.parse(message);
		console.log("SERVER:", parsed); // eslint-disable-line no-console

		if (parsed.Error) {
			console.log("err", parsed.Error); // eslint-disable-line no-console
		}

		if (parsed.Hello) {
			console.log("hello", parsed.Hello); // eslint-disable-line no-console
		}

		if (parsed.Set) {
			console.log("set", parsed.Set); // eslint-disable-line no-console
		}

		if (parsed.List) {
			console.log("list", parsed.List); // eslint-disable-line no-console
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
		}
		this.sendState();
	}

	sendState() {
		let clientIgnoreIsNotSet = (this.clientIgnoringOnTheFly == 0 || this.serverIgnoringOnTheFly != 0);
		let output = {};
		output.State = {};

		if (clientIgnoreIsNotSet) {
			output.State.playstate = {};
			output.State.playstate.position = 0.0;
			output.State.playstate.paused = true;
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

	sendHello(username) {
		this.command("send", {
			"Hello": {
				username,
				"room": {
					name: "test"
				},
				"version": "1.5.1"
			}
		});
	}
}

// Adds the protocol to SyncWeb statically, so every Client has it
SyncWeb.Client.addStaticProtocol(new WebSocketProtocol());