import EventTracker from "../util/EventTracker";

export default interface JSONMessageProtocol {
	readonly message: EventTracker<(msg: any) => void>;
	readonly open: EventTracker<() => void>;
	readonly close: EventTracker<() => void>;
	readonly error: EventTracker<(e: any) => void>;

	send(msg: any): void;
	disconnect(): void;
}