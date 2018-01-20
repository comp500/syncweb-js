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
		if (!this.eventList[name] && !this.eventList["*"]) return 0;

		for (let i = 0; i < this.eventList[name].length; i++) {
			this.eventList[name][i](data);
		}

		if (this.eventList["*"] && this.eventList["*"].length > 0) {
			for (let i = 0; i < this.eventList["*"].length; i++) {
				this.eventList["*"][i](data);
			}
			return this.eventList[name].length + this.eventList["*"].length;
		} else {
			return this.eventList[name].length;
		}
	}

	removeListener(name, callback) {
		// TODO: find a way to gracefully report problems like this
		if (!this.eventList[name]) return;

		let index = this.eventList[name].indexOf(callback);
		if (index > -1) this.eventList.splice(index, 1);
	}
}

SyncWeb.util.EventEmitter = EventEmitter;