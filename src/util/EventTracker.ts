// Quite possibly the most elegant event system since the Minecraft Forge Event Bus
export default class EventTracker<T extends (...args: any) => any> {
	private subscribers: T[] = [];

	subscribe(func: T): void {
		this.subscribers.push(func);
	}

	unsubscribe(func: T): void {
		let i = this.subscribers.indexOf(func);
		this.subscribers.splice(i, 1);
	}

	emit(...args: Parameters<T>): ReturnType<T>[] {
		return this.subscribers.map(func => func(...args));
	}
}
