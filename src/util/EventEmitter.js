class EventEmitter {
	constructor() {
		this.eventList = {};
		this.activeEvents = true;
	}

	on(name, callback) {
		if (this.eventList[name] == null) {
			this.eventList[name] = [];
		}
		this.eventList[name].push(callback);
	}

	once(name, callback) {
		let modifiedCallback = (data) => {
			callback(data);
			this.removeListener(name, modifiedCallback);
		};
		this.on(name, modifiedCallback);
	}

	any(callback) {
		this.on("*", callback);
	}

	emit(name, data) {
		if (!this.activeEvents) return 0;

		let totalList;
		if (this.eventList[name] && this.eventList["*"]) {
			totalList = this.eventList[name].concat(this.eventList["*"]);
		} else if (this.eventList[name]) {
			totalList = this.eventList[name];
		} else if (this.eventList["*"]) {
			totalList = this.eventList["*"]
		} else {
			return 0;
		}

		for (let i = 0; i < totalList.length; i++) {
			totalList[i](name, data);
		}

		return totalList.length;
	}

	removeListener(name, callback) {
		// TODO: find a way to gracefully report problems like this
		if (!this.eventList[name]) return;

		let index = this.eventList[name].indexOf(callback);
		if (index > -1) this.eventList.splice(index, 1);
	}
}

SyncWeb.util.EventEmitter = EventEmitter;