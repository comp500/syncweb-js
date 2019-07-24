import JSONMessageProtocol from "./JSONMessageProtocol";
import EventTracker from "../util/EventTracker";

export default class WebSocketProtocol implements JSONMessageProtocol {
	message = new EventTracker<(msg: any) => void>();
	open = new EventTracker<() => void>();
	close = new EventTracker<() => void>();
	error = new EventTracker<(e: any) => void>();

	private socket: WebSocket = null;

	constructor(url: string) {
		this.socket = new WebSocket(url);
		this.socket.addEventListener("message", e => {
			if (e.data == null) {
				return;
			}
			// Split into JSON lines
			e.data.split("\n").forEach((messageText) => {
				if (messageText == null) return;
				if (messageText.length < 1) return;
				let dataJSON = JSON.parse(messageText);
				this.message.emit(dataJSON);
			});
		});
		this.socket.addEventListener("open", () => {
			this.open.emit();
		});
		this.socket.addEventListener("close", () => {
			this.close.emit();
		});
		this.socket.addEventListener("error", e => {
			this.error.emit(e);
		});
	}

	send(msg: any): void {
		if (this.socket != null) {
			this.socket.send(JSON.stringify(msg));
		}
	}

	disconnect(): void {
		if (this.socket != null) {
			this.socket.close();
		}
		this.socket = null;
	}
}