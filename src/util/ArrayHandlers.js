let ArrayHandlers = {
	get(array, content) {
		if (typeof content == "string") {
			return array.find((itemFound) => {
				return itemFound.name == content;
			});
		} else {
			if (array.includes(content)) {
				return content;
			} else {
				return undefined;
			}
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

SyncWeb.util.ArrayHandlers = ArrayHandlers;