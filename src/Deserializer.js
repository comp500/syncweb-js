export default class {
	constructor () {
		this.messagecallbacks = [];
	}

	write(message) {
		let messageParsed = JSON.parse(message);
		console.log(messageParsed);
		/*if (messageParsed.length > 0) {
			this.messagecallbacks.forEach((callback) => callback("seek", 55));
		}*/
	}

	onMessage(callback) {
		this.messagecallbacks.push(callback);
	}
}