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
		return ArrayHandlers.remove(this.protocolList, protocol);
	}

	static addStaticProtocol(protocol) {
		staticProtocolList.push(protocol);
	}

	static getStaticProtocol(protocol) {
		if (typeof protocol == "string") {
			return staticProtocolList.find((protocolFound) => {
				return protocolFound.name == protocol;
			});
		} else {
			return staticProtocolList.find((protocolFound) => {
				return protocolFound == protocol;
			});
		}
	}

	static removeStaticProtocol(protocol) {
		let index;
		if (typeof protocol == "string") {
			index = staticProtocolList.findIndex((protocolFound) => {
				return protocolFound.name == protocol;
			});
		} else {
			index = staticProtocolList.indexOf(protocol);
		}
		if (index > -1) staticProtocolList.splice(index, 1);
	}

	
}

SyncPlay.Client = Client;