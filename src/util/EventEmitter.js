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

	removeListener(name, callback) {
		// TODO: find a way to gracefully report problems like this
		if (!this.eventList[name]) return;
		
		let index = this.eventList[name].indexOf(callback);
		if (index > -1) this.eventList.splice(index, 1);
	}
}

SyncPlay.util.EventEmitter = EventEmitter;