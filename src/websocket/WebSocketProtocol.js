class WebSocketProtocol extends SyncPlay.Protocol {
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

// Adds the protocol to SyncPlay statically, so every Client has it
SyncPlay.Client.addStaticProtocol(new WebSocketProtocol());