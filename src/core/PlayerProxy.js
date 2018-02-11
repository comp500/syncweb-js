class PlayerProxy {
	constructor(name) {
		this.name = name;
	}

	initialise(client) {
		this.client = client;
	}
}

SyncWeb.PlayerProxy = PlayerProxy;