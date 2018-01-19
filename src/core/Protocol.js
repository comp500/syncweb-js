/* global EventEmitter */

class Protocol extends EventEmitter {
	constructor(name) {
		super();
		this.name = name;
	}
}

SyncWeb.Protocol = Protocol;