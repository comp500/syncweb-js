class Player {
	constructor(name) {
		this.name = name;
	}

	initialise(client) {
		this.client = client;
	}
}

SyncWeb.Player = Player;