export default class {
	constructor() {
		console.log("Constructed WSConn!");
	}

	connect(path) {
		return new Promise((resolve, reject) => {
			this.socket = new WebSocket(path);

			this.socket.addEventListener("open", () => {
				resolve();
			});

			this.socket.addEventListener("error", (e) => {
				reject(e);
			});
		});
	}

	write(msg) {
		this.socket.send(msg);
	}

	onMessage(callback) {
		this.socket.addEventListener("message", (event) => {
			callback(event.data);
		});
	}

	onError(callback) {
		this.socket.addEventListener("error", (e) => {
			callback(e);
		});
	}

	close() {
		this.socket.close();
	}

	getState() {
		return this.socket.readyState;
	}
}