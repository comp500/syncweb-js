import Serializer from "./Serializer";
import Deserializer from "./Deserializer";
import WebSocketConnection from "./WebSocketConnection";

export default class {
	constructor(callback) {
		console.log("Constructed!");
		this.eventHandler = callback;
		this.errorcallbacks = [];
	}

	async connect(path) {
		this.connection = new WebSocketConnection();
		await this.connection.connect(path);
		this.serializer = new Serializer((stringToWrite) => {
			this.connection.write(stringToWrite);
		});
		this.deserializer = new Deserializer(this.eventHandler);
		this.connection.onMessage((msg) => {
			try {
				this.deserializer.write(msg);
			} catch (e) {
				this.errorcallbacks.forEach((callback) => callback(e));
			}
		});

		this.connection.onError((e) => {
			this.errorcallbacks.forEach((callback) => callback(e));
		});
	}

	close() {
		try {
			this.connection.close();
		} catch (e) {
			// ignore as already closed
		}

		// free memory?
		delete this.connection;
		delete this.serializer;
		delete this.deserializer;
	}

	getState() {
		if (this.connection) {
			this.connection.getState();
		} else {
			return -1;
		}
	}

	onError(callback) {
		this.errorcallbacks.push(callback);
	}
}