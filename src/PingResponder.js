export default class {
	constructor (serializer, deserializer) {
		this.serializer = serializer;
		this.deserializer = deserializer;
		this.deserializer.onMessage(this.handleEvent);
	}

	handleEvent(event, data) {
		// there, eslint. i used it.
		event;
		data;
	}

	close() {
		
	}
}