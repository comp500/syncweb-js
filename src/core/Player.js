/* global EventEmitter */

class Player extends EventEmitter {
	constructor(name) {
		super();
		this.name = name;
	}

	initialise(client) {
		this.client = client;
	}
}

SyncWeb.Player = Player;