/* global EventEmitter, ArrayHandlers */

let staticProtocolList = [];
let staticPlayerProxyList = [];
let staticPlayerList = [];

class Client extends EventEmitter {
	constructor(playerElement) {
		super();
		this.protocolList = staticProtocolList;
		this.playerList = staticPlayerList;
		this.playerProxyList = staticPlayerProxyList;
		this.state = 0;
		this.playerElement = playerElement;
	}

	addProtocol(protocol) {
		this.protocolList.push(protocol);
	}

	getProtocol(protocol) {
		return ArrayHandlers.get(this.protocolList, protocol);
	}

	removeProtocol(protocol) {
		ArrayHandlers.remove(this.protocolList, protocol);
	}

	static addStaticProtocol(protocol) {
		staticProtocolList.push(protocol);
	}

	static getStaticProtocol(protocol) {
		return ArrayHandlers.get(staticProtocolList, protocol);
	}

	static removeStaticProtocol(protocol) {
		ArrayHandlers.remove(staticProtocolList, protocol);
	}

	addPlayer(player) {
		this.playerList.push(player);
	}

	getPlayer(player) {
		return ArrayHandlers.get(this.playerList, player);
	}

	removePlayer(player) {
		ArrayHandlers.remove(this.playerList, player);
	}

	static addStaticPlayer(player) {
		staticPlayerList.push(player);
	}

	static getStaticPlayer(player) {
		return ArrayHandlers.get(staticPlayerList, player);
	}

	static removeStaticPlayer(player) {
		ArrayHandlers.remove(staticPlayerList, player);
	}

	addPlayerProxy(playerProxy) {
		this.playerProxyList.push(playerProxy);
	}

	getPlayerProxy(playerProxy) {
		return ArrayHandlers.get(this.playerProxyList, playerProxy);
	}

	removePlayerProxy(playerProxy) {
		ArrayHandlers.remove(this.playerProxyList, playerProxy);
	}

	static addStaticPlayerProxy(playerProxy) {
		staticPlayerProxyList.push(playerProxy);
	}

	static getStaticPlayerProxy(playerProxy) {
		return ArrayHandlers.get(staticPlayerProxyList, playerProxy);
	}

	static removeStaticPlayerProxy(playerProxy) {
		ArrayHandlers.remove(staticPlayerProxyList, playerProxy);
	}

	connect(protocol, options) {
		if (this.state != 0) {
			// TODO: general error handler instead of throwing errors?
			throw new Error("Client is currently connected, must disconnect first before reconnecting.");
		}

		let fetchedProtocol = this.getProtocol(protocol);
		if (fetchedProtocol == undefined || !fetchedProtocol) {
			throw new Error("No protocol of that name is loaded!");
		}

		this.currentProtocol = fetchedProtocol;
		this.state = 1;

		this.proxyEvents("connecting", protocol);
		fetchedProtocol.any(this.proxyEvents.bind(this));
		fetchedProtocol.on("seturl", this.setURL.bind(this));

		// TODO: implement some sort of log system, for errors, connection progress etc.

		fetchedProtocol.connect(options, () => {
			if (this.state != 1) {
				return; // ignore event if not in connecting state
			}
			this.state = 2;
			this.proxyEvents("connected");
		});
	}

	// events relay status, such as "connected", "connecting" etc.
	proxyEvents(event, data) {
		for (let i = 0; i < this.playerProxyList.length; i++) {
			this.playerProxyList[i].on(event, data);
		}
		if (this.currentPlayer) {
			// players must not respond to seturl
			this.currentPlayer.on(event, data);
		}
	}

	// commands relay information about change of state, e.g. protocol tells player to pause
	proxyCommand(command, data) {
		if (this.currentPlayer) {
			for (let i = 0; i < this.playerProxyList.length; i++) {
				this.playerProxyList[i].command(command, data);
			}
			this.currentPlayer.command(command, data);
		} else {
			// TODO: maybe error if problematic?
		}
	}

	proxyCommandToProtocol(command, data) {
		// TODO: Should players emit (and have proxied) events?
		if (this.currentPlayer) {
			for (let i = 0; i < this.playerProxyList.length; i++) {
				this.playerProxyList[i].command(command, data);
			}
			this.currentProtocol.command(command, data);
		} else {
			// TODO: maybe error if problematic?
		}
	}

	setURL(url) {
		if (this.currentPlayer) {
			// TODO: what happens when a http player
			//       and yt player coexist? how do
			//       we choose which to use?
			if (this.currentPlayer.supports(url)) {
				this.proxyCommand("seturl", url);
				return;
			}
		}

		let foundPlayer = this.playerList.find((player) => {
			return player.supports(url);
		});
		if (foundPlayer) {
			// if player is found, switch to it
			if (this.currentPlayer) this.currentPlayer.command("terminate");
			this.currentPlayer = foundPlayer;
			this.proxyCommand("seturl", url);
		} else {
			// TODO: handle no players to play url
			//       catch-all player?
			throw new Error("No players to handle URL available");
		}
	}
	
}

SyncWeb.Client = Client;