import WebSocketProtocol from "./WebSocketProtocol";
import JSONMessageProtocol from "./JSONMessageProtocol";
import PingService from "../util/PingService";
import EventTracker from "../util/EventTracker";
import SyncplayFile from "./messages/SyncplayFile";
import SyncplayRequest from "./messages/SyncplayRequest";
import SyncplayResponse from "./messages/SyncplayResponse";

export default class SyncplayJSONClient {
	private transport?: JSONMessageProtocol;

	private currentPosition = 0;
	private paused = true;
	private doSeek = false;
	private isReady = false;
	private roomdetails: any = {};
	private clientIgnoringOnTheFly = 0;
	private serverIgnoringOnTheFly = 0;
	private pingService = new PingService();
	private serverPosition = 0;
	private updateToServer = true;
	private currentFile?: SyncplayFile;
	private serverDetails?: any;
	private stateChanged = false;
	private latencyCalculation?: number;
	private currentRoom = "";

	private _currentUsername = "";
	getCurrentUsername(): string {
		return this._currentUsername;
	}

	readonly connected = new EventTracker<(connectedString: string) => void>();
	readonly joined = new EventTracker<(userName: string, roomName: string) => void>();
	readonly left = new EventTracker<(userName: string, roomName: string) => void>();
	readonly moved = new EventTracker<(userName: string, roomName: string) => void>();
	readonly roomDetailsUpdated = new EventTracker<(roomDetails: any) => void>();
	readonly seek = new EventTracker<(position: number, setBy: string) => void>();
	readonly pause = new EventTracker<(setBy: string) => void>();
	readonly unpause = new EventTracker<(setBy: string) => void>();
	readonly chat = new EventTracker<(userName: string, message: string) => void>();

	connect(options: { name: string; url: string; room: string; password: string }, callback: () => void): void {
		this.transport = new WebSocketProtocol(options.url);

		this.transport.open.subscribe(() => {
			if (options.password) {
				this.sendHello(options.name, options.room, options.password);
			} else {
				this.sendHello(options.name, options.room);
			}
			this.sendReady();
			this.sendListRequest();
			if (this.currentFile) {
				this.sendFile();
			}
			callback();
		});

		this.transport.message.subscribe(msg => {
			this.handleMessage(<SyncplayResponse>msg);
		});
	}

	disconnect(): void {
		if (this.transport != undefined) {
			this.transport.disconnect();
			this.transport = undefined;
		}
	}

	private sendData(data: SyncplayRequest): void {
		if (this.transport != undefined) {
			this.transport.send(data);
		}
	}

	setTime(position: number): void {
		this.currentPosition = position;
	}

	seekTo(position: number): void {
		this.setTime(position);
		this.doSeek = true;
		this.sendState();
	}

	setPause(pause: boolean): void {
		this.paused = pause;
		if (!pause && !this.isReady) {
			// potential problem: unpause is sent from video.play()
			// could result in unintentional ready setting
			this.isReady = true;
			this.sendReady();
		}
		this.sendState();
	}

	sendFile(): void;
	sendFile(duration: number, name: string): void;
	sendFile(duration?: number, name?: string): void {
		if (name != undefined) {
			// TODO size attribute for non-html5 video players?
			// 0 means unknown duration
			if (!duration) duration = 0;
			this.currentFile = { duration, name, size: 0 };
		}
		if (this.currentFile != undefined) {
			this.sendData(SyncplayRequest.setFile(this.currentFile));
			this.sendListRequest();
		}
	}

	sendReady(ready?: boolean): void {
		if (ready == undefined) {
			ready = this.isReady;
		}
		this.sendData(SyncplayRequest.setReady(ready, true, this._currentUsername));
	}

	private handleMessage(msg: SyncplayResponse): void {
		console.log("SERVER:", msg); // eslint-disable-line no-console

		if (msg.Error) {
			this.parseError(msg.Error);
		}
		if (msg.Hello) {
			this.parseHello(msg.Hello);
		}
		if (msg.Set) {
			this.parseSet(msg.Set);
		}
		if (msg.List) {
			this.parseList(msg.List);
		}
		if (msg.State) {
			this.parseState(msg.State);
		}
		if (msg.Chat) {
			this.parseChat(msg.Chat);
		}

		this.sendState();
	}

	private parseError(data: any): void {
		console.log("err", data); // eslint-disable-line no-console
		// TODO disconnect
	}

	private parseHello(data: any): void {
		console.log("hello", data); // eslint-disable-line no-console
		// TODO handle failed logins, etc.
		this.serverDetails = {
			version: data.version,
			realversion: data.realversion,
			features: data.features,
			motd: data.motd
		};
		let connectedString = `Connected to server, version ${data.version}.`;
		if (data.motd) {
			connectedString += ` MOTD:
			${data.motd}`;
		}
		this.connected.emit(connectedString);
		// roomEventRequest?
	}

	private parseSet(data: any): void {
		console.log("set", data); // eslint-disable-line no-console
		// TODO playlists
		if (data.user) {
			Object.keys(data.user).forEach(key => {
				let user = data.user[key];
				if (user.event) {
					if (user.event.joined) {
						this.joined.emit(key, user.room.name);
						this.roomdetails[key] = { room: user.room.name };
					}
					if (user.event.left) {
						this.left.emit(key, user.room.name);
						delete this.roomdetails[key];
					}
				} else {
					if (this.roomdetails[key] && this.roomdetails[key].room != user.room.name) {
						// user has moved
						this.roomdetails[key].room = user.room.name;
						this.moved.emit(key, user.room.name);
					}
				}
				if (user.file) {
					this.roomdetails[key].file = user.file;
				}
				this.roomDetailsUpdated.emit(this.roomdetails);
			});
		}

		if (data.ready) {
			if (!this.roomdetails[data.ready.username]) {
				this.roomdetails[data.ready.username] = {};
			}
			this.roomdetails[data.ready.username].isReady = data.ready.isReady;
			this.roomdetails[data.ready.username].manuallyInitiated = data.ready.manuallyInitiated;

			this.roomDetailsUpdated.emit(this.roomdetails);
		}

		// to implement:
		// room, controllerAuth, newControlledRoom, playlistIndex, playlistChange
	}

	private parseList(data: any): void {
		this.roomdetails = {};
		Object.keys(data).forEach(room => {
			Object.keys(data[room]).forEach(user => {
				this.roomdetails[user] = data[room][user];
				this.roomdetails[user].room = room;
			});
		});
		this.roomDetailsUpdated.emit(this.roomdetails);
	}

	private parseState(data: any): void {
		let messageAge = 0;
		if (data.ignoringOnTheFly && data.ignoringOnTheFly.server) {
			this.serverIgnoringOnTheFly = data.ignoringOnTheFly.server;
			this.clientIgnoringOnTheFly = 0;
			this.stateChanged = false;
		}
		if (data.playstate) {
			if (data.playstate.setBy && data.playstate.setBy != this._currentUsername) {
				if (this.updateToServer || (data.playstate.doSeek && !this.doSeek)) {
					this.seek.emit(data.playstate.position, data.playstate.setBy);
					this.updateToServer = false;
				}
				if (this.paused != data.playstate.paused) {
					if (data.playstate.paused) {
						this.pause.emit(data.playstate.setBy);
						this.paused = true;
					} else {
						this.unpause.emit(data.playstate.setBy);
						this.paused = false;
					}
				}
			}
			if (data.playstate.position) {
				this.serverPosition = data.playstate.position;
			}
		}
		if (data.ping) {
			if (data.ping.latencyCalculation) {
				this.latencyCalculation = data.ping.latencyCalculation;
			}
			if (data.ping.clientLatencyCalculation) {
				this.pingService.receiveMessage(data.ping.clientLatencyCalculation, data.ping.serverRtt);
			}
			messageAge = this.pingService.getLastForwardDelay();
		}

		// update position due to message delays
		if (!this.paused) {
			this.serverPosition += messageAge;
		}

		// compare server position and client position, ffwd/rewind etc.
	}

	private parseChat(data: any): void {
		this.chat.emit(data.username, data.message);
	}

	private sendState(): void {
		const clientIgnoreIsNotSet = this.clientIgnoringOnTheFly == 0 || this.serverIgnoringOnTheFly != 0;

		let wasDoSeek = false;
		if (this.doSeek) {
			wasDoSeek = true;
			this.doSeek = false;
		}
		const playstate = clientIgnoreIsNotSet ? {
			position: this.currentPosition,
			paused: this.paused,
			doSeek: wasDoSeek
		} : undefined;

		let ping = {
			latencyCalculation: this.latencyCalculation,
			clientLatencyCalculation: Date.now() / 1000,
			clientRtt: this.pingService.getRTT()
		};

		if (this.stateChanged) {
			// TODO update this properly
			this.clientIgnoringOnTheFly += 1;
		}

		let ignoringOnTheFlyClient: number | undefined;
		let ignoringOnTheFlyServer: number | undefined;
		if (this.serverIgnoringOnTheFly > 0) {
			ignoringOnTheFlyServer = this.serverIgnoringOnTheFly;
			this.serverIgnoringOnTheFly = 0;
		}
		if (this.clientIgnoringOnTheFly > 0) {
			ignoringOnTheFlyClient = this.clientIgnoringOnTheFly;
		}

		this.sendData(SyncplayRequest.state(ping, ignoringOnTheFlyClient, ignoringOnTheFlyServer, playstate));
	}

	private sendHello(username: string, room: string, password?: string): void {
		this._currentUsername = username;
		this.currentRoom = room;

		this.sendData(SyncplayRequest.hello(username, room, password));
	}

	private sendListRequest(): void {
		this.sendData(SyncplayRequest.requestList());
	}
}
