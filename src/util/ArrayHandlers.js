let ArrayHandlers = {
	get(array, content) {
		if (typeof content == "string") {
			return array.find((itemFound) => {
				return itemFound.name == content;
			});
		} else {
			return array.find((itemFound) => {
				return itemFound == content;
			});
		}
	},

	remove(array, content) {
		let index;
		if (typeof protocol == "string") {
			index = this.protocolList.findIndex((protocolFound) => {
				return protocolFound.name == protocol;
			});
		} else {
			index = this.protocolList.indexOf(protocol);
		}
		if (index > -1) this.protocolList.splice(index, 1);
	}
};

SyncPlay.util.ArrayHandlers = ArrayHandlers;