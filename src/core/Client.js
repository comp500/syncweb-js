/* global EventEmitter */
/* global ArrayHandlers */

let staticProtocolList = [];

class Client extends EventEmitter {
	constructor() {
		super();
		this.protocolList = staticProtocolList;
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

	
}

SyncPlay.Client = Client;