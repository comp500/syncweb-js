class EventEmitter {
	constructor() {
		this.eventList = {};
	}

	on(name, callback) {
		if (this.eventList[name] == null) {
			this.eventList[name] = [];
		}
		this.eventList[name].push(callback);
	}

	emit(name, data) {
		if (!this.eventList[name]) return 0;
		for (let i = 0; i < this.eventList[name]; i++) {
			this.eventList[name](data);
		}
		return this.eventList[name].length;
	}
}

SyncPlay.util.EventEmitter = EventEmitter;