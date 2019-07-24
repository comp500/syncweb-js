export default class EventTracker<T> {
	private subscribers: T[] = [];

	subscribe(func: T): void {
		this.subscribers.push(func);
	}

	unsubscribe(func: T): void {
		let i = this.subscribers.indexOf(func);
		this.subscribers.splice(i, 1);
	}

	call(caller: (func: T) => void): void {
		this.subscribers.forEach((func) => {
			caller(func);
		});
	}
}