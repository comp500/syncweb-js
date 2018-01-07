export default class {
	constructor (reader) {
		this.reader = reader;
	}

	write(message) {
		let messageParsed = JSON.parse(message);
		if (messageParsed.length > 0) {
			this.reader("seek", 55);
		}
	}
}