// Quite possibly the most elegant event system since the Minecraft Forge Event Bus
export default class EventTracker<T> {
	private subscribers: T[] = [];

	subscribe(func: T): void {
		this.subscribers.push(func);
	}

	unsubscribe(func: T): void {
		let i = this.subscribers.indexOf(func);
		this.subscribers.splice(i, 1);
	}

	// Works like a map(), but over each subscriber function
	// you need to call the given function in the function you give, but the return value is passed back as an array
	call<U>(caller: (func: T) => U): U[] {
		return this.subscribers.map((func) => caller(func));
	}
}