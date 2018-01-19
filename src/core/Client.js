/* global EventEmitter */
/* global ArrayHandlers */

let staticProtocolList = [];
let staticPlayerProxyList = [];

class Client extends EventEmitter {
	constructor() {
		super();
		this.protocolList = staticProtocolList;
		this.playerList = [];
		this.playerProxyList = staticPlayerProxyList;
	}

	connect() {
		
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
	
}

SyncPlay.Client = Client;