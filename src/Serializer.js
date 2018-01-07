export default class {
	constructor (writer) {
		this.writer = writer;
	}

	seek(position) {
		this.writer(JSON.stringify({
			"seekto": position
		}));
	}
}