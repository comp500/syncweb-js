class WebSocketProtocol extends SyncWeb.Protocol {
	constructor() {
		super("WebSocket-builtin");
	}

	connect(options, callback) {
		this.socket = new WebSocket(options.url);

		this.socket.addEventListener("open", () => {
			callback();
		});

		this.socket.addEventListener("message", (data) => {
			this.emit("message", data);
		});
	}

	command(command, data) {
		command;
		data;
	}
}

// Adds the protocol to SyncWeb statically, so every Client has it
SyncWeb.Client.addStaticProtocol(new WebSocketProtocol());