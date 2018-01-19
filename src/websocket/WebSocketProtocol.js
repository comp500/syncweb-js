/* global Protocol, Client */

class WebSocketProtocol extends Protocol {
	constructor() {
		super("WebSocket-builtin");
	}

	connect(options, callback) {
		this.socket = new WebSocket(options.url);
		this.socket.addEventListener("open", () => {
			callback();
		});
	} 
}

Client.addStaticProtocol(new WebSocketProtocol());