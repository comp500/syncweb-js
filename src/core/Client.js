/* global EventEmitter, ArrayHandlers */

let staticProtocolList = [];
let staticPlayerProxyList = [];

class Client extends EventEmitter {
	constructor() {
		super();
		this.protocolList = staticProtocolList;
		this.playerList = [];
		this.playerProxyList = staticPlayerProxyList;
		this.state = 0;
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
			throw new Error("Client is currently connected, must disconnect first before reconnecting.");
		}

		let fetchedProtocol = this.getProtocol(protocol);
		if (fetchedProtocol == undefined || !fetchedProtocol) {
			throw new Error("No protocol of that name is loaded!");
		}

		this.currentProtocol = fetchedProtocol;
		this.state = 1;

		this.proxyEvents("connecting", protocol);
		fetchedProtocol.any(this.proxyEvents);
		fetchedProtocol.on("seturl", this.setURL);

		fetchedProtocol.connect(options, () => {
			if (this.state != 1) {
				return; // ignore event if not in connecting state
			}
			this.state = 2;
			this.proxyEvents("connected");
		});
	}

	proxyEvents(event, data) {
		for (let i = 0; i < this.playerProxyList; i++) {
			this.playerProxyList[i].on(event, data);
		}
		if (this.currentPlayer) {
			// players must not respond to seturl
			this.currentPlayer.on(event, data);
		}
	}

	proxyCommand(command, data) {
		if (this.currentPlayer) {
			for (let i = 0; i < this.playerProxyList; i++) {
				this.playerProxyList[i].command(command, data);
			}
			this.currentPlayer.command(command, data);
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
			this.currentPlayer.command("terminate");
			this.currentPlayer = foundPlayer;
			this.proxyCommand("seturl", url);
		} else {
			// TODO: handle no players to play url
			//       catch-all player?
			throw new Error("No players to handle URL available");
		}
	}
	
}

SyncPlay.Client = Client;