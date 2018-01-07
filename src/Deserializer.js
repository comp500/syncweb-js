export default class {
	constructor () {
		this.errorcallbacks = [];
	}

	write(message) {
		let messageParsed = JSON.parse(message);
		if (messageParsed.length > 0) {
			this.errorcallbacks.forEach((callback) => callback("seek", 55));
		}
	}

	onMessage(callback) {
		this.errorcallbacks.push(callback);
	}
}