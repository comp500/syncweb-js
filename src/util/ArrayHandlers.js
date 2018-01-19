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
		if (typeof content == "string") {
			index = array.findIndex((itemFound) => {
				return itemFound.name == content;
			});
		} else {
			index = array.indexOf(content);
		}
		if (index > -1) array.splice(index, 1);
	}
};

SyncPlay.util.ArrayHandlers = ArrayHandlers;