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
		});
	}

	command(command, data) {
		if (command == "send") {
			this.socket.send(data);
		}
	}
}

// Adds the protocol to SyncWeb statically, so every Client has it
SyncWeb.Client.addStaticProtocol(new WebSocketProtocol());