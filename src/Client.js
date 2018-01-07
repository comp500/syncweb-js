import Serializer from "./Serializer";
import Deserializer from "./Deserializer";
import WebSocketConnection from "./WebSocketConnection";

export default class {
	constructor(options, callback) {
		console.log("Constructed!");
		this.eventHandler = callback;
		this.options = options;
	}

	async connect(path) {
		this.connection = new WebSocketConnection(this.options);
		await this.connection.connect(path);
		this.serializer = new Serializer((stringToWrite) => {
			this.connection.write(stringToWrite);
		});
		this.deserializer = new Deserializer(this.eventHandler);
		this.connection.onMessage((msg) => {
			this.deserializer.write(msg);
		});
	}
}