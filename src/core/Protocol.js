/* global EventEmitter */

class Protocol extends EventEmitter {
	constructor(name) {
		super();
		this.name = name;
	}

	initialise(client) {
		this.client = client;
	}
}

SyncWeb.Protocol = Protocol;