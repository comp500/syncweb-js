/* global EventEmitter */

class Protocol extends EventEmitter {
	constructor(name) {
		super();
		this.name = name;
	}
}

SyncPlay.Protocol = Protocol;