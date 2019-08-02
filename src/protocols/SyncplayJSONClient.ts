import WebSocketProtocol from "./WebSocketProtocol";
import JSONMessageProtocol from "./JSONMessageProtocol";
import PingService from "../util/PingService";
import EventTracker from "../util/EventTracker";
import SyncplayFile from "./messages/SyncplayFile";
import SyncplayRequest from "./messages/SyncplayRequest";
import SyncplayResponse from "./messages/SyncplayResponse";
import User from "./User";

export default class SyncplayJSONClient {
	private transport?: JSONMessageProtocol;

	private currentPosition = 0;
	private paused = true;
	private doSeek = false;
	private isReady = false;
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

	private _cachedUsers: User[] = [];
	getAllUsers(): ReadonlyArray<User> {
		return this._cachedUsers;
	}
	getAllRooms(): string[] {
		return this._cachedUsers
			.map(u => u.room)
			.filter((v, i, a) => {
				if (v == undefined) {
					return false;
				}
				return a.indexOf(v) === i;
			}) as string[];
	}
	getUsersOfRoom(name: string): User[] {
		return this._cachedUsers.filter(u => u.room == name);
	}
	private addOrGetUser(name: string, room?: string): User {
		for (let i = 0; i < this._cachedUsers.length; i++) {
			if (this._cachedUsers[i].name == name) {
				if (room != undefined) {
					this._cachedUsers[i].room = room;
				}
				return this._cachedUsers[i];
			}
		}
		let newUser = new User(name, room);
		this._cachedUsers.push(newUser);
		return newUser;
	}
	private removeUser(user: User | string) {
		if (user instanceof User) {
			let i = this._cachedUsers.indexOf(user);
			if (i > -1) {
				this._cachedUsers.splice(i, 1);
			}
		} else {
			for (let i = 0; i < this._cachedUsers.length; i++) {
				if (this._cachedUsers[i].name == user) {
					this._cachedUsers.splice(i, 1);
					break;
				}
			}
		}
	}
	getUser(name: string): User | undefined {
		for (let i = 0; i < this._cachedUsers.length; i++) {
			if (this._cachedUsers[i].name == name) {
				return this._cachedUsers[i];
			}
		}
		return undefined;
	}

	// TODO: make connectedString more descriptive, provide more info, or store MOTD somewhere
	readonly connected = new EventTracker<(connectedString: string) => void>();
	readonly joined = new EventTracker<(user: User) => void>();
	readonly left = new EventTracker<(user: User) => void>();
	readonly moved = new EventTracker<(user: User, oldRoom: string) => void>();
	readonly usersUpdated = new EventTracker<(users: ReadonlyArray<User>) => void>();
	readonly seek = new EventTracker<(position: number, setBy: User) => void>();
	readonly pause = new EventTracker<(setBy: User) => void>();
	readonly unpause = new EventTracker<(setBy: User) => void>();
	readonly chat = new EventTracker<(user: User, message: string) => void>();
	// TODO: error events, error handling and propagation

	connect(name: string, room: string, url: string, password?: string): void;
	connect(name: string, room: string, transport: JSONMessageProtocol, password?: string): void;
	connect(name: string, room: string, urlOrTransport: string | JSONMessageProtocol, password?: string): void {
		if (typeof urlOrTransport == "string") {
			this.transport = new WebSocketProtocol(urlOrTransport);
		} else {
			this.transport = urlOrTransport;
		}

		this.transport.open.subscribe(() => {
			this.sendHello(name, room, password);
			this.sendReady();
			this.sendListRequest();
			if (this.currentFile != undefined) {
				this.sendFile();
			}
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

	sendFile(name?: string, duration?: number): void {
		if (name != undefined) {
			// TODO size attribute for non-html5 video players?
			// 0 means unknown duration
			if (duration == undefined) duration = 0;
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

		if (SyncplayResponse.hasError(msg)) {
			this.parseError(msg);
		}
		if (SyncplayResponse.hasHello(msg)) {
			this.parseHello(msg);
		}
		if (SyncplayResponse.hasSet(msg)) {
			this.parseSet(msg);
		}
		if (SyncplayResponse.hasList(msg)) {
			this.parseList(msg);
		}
		if (SyncplayResponse.hasState(msg)) {
			this.parseState(msg);
		}
		if (SyncplayResponse.hasChat(msg)) {
			this.parseChat(msg);
		}

		this.sendState();
	}

	private parseError(msg: Required<Pick<SyncplayResponse, "Error">>): void {
		console.log("err", msg.Error.message); // eslint-disable-line no-console
		// TODO disconnect
	}

	private parseHello(msg: Required<Pick<SyncplayResponse, "Hello">>): void {
		console.log("hello", msg); // eslint-disable-line no-console
		// TODO handle failed logins, etc.
		this.serverDetails = {
			version: msg.Hello.version,
			realversion: msg.Hello.realversion,
			features: msg.Hello.features,
			motd: msg.Hello.motd
		};
		let connectedString = `Connected to server, version ${msg.Hello.realversion}.`;
		if (msg.Hello.motd) {
			connectedString += ` MOTD:
			${msg.Hello.motd}`;
		}
		this.connected.emit(connectedString);
		// roomEventRequest?
	}

	private parseSet(msg: Required<Pick<SyncplayResponse, "Set">>): void {
		console.log("set", msg); // eslint-disable-line no-console
		// TODO playlists
		if (msg.Set.user) {
			Object.keys(msg.Set.user).forEach(key => {
				let user = msg.Set.user![key];
				if (user.event) {
					if (user.event.joined) {
						this.joined.emit(this.addOrGetUser(key, user.room.name));
					}
					if (user.event.left) {
						let currUser = this.getUser(key);
						if (currUser != undefined) {
							this.removeUser(currUser);
							this.left.emit(currUser);
						}
					}
				} else {
					let cachedUser = this.addOrGetUser(key);
					if (cachedUser.room != undefined && cachedUser.room != user.room.name) {
						let oldRoom = cachedUser.room;
						cachedUser.room = user.room.name;
						this.moved.emit(cachedUser, oldRoom);
					}
				}
				if (user.file) {
					let cachedUser = this.addOrGetUser(key);
					if (cachedUser != undefined) {
						cachedUser.file = user.file;
					}
				}
				this.usersUpdated.emit(this._cachedUsers);
			});
		}

		if (msg.Set.ready) {
			let cachedUser = this.addOrGetUser(msg.Set.ready.username);
			// TODO: wut does isReady = null mean?!
			cachedUser.isReady = msg.Set.ready.isReady == null ? false : msg.Set.ready.isReady;
			cachedUser.manuallyInitiated = msg.Set.ready.manuallyInitiated;

			this.usersUpdated.emit(this._cachedUsers);
		}

		// to implement:
		// room, controllerAuth, newControlledRoom, playlistIndex, playlistChange
	}

	private isEmptyObject(obj: Object): obj is {} {
		return Object.keys(obj).length == 0;
	}

	private parseList(msg: Required<Pick<SyncplayResponse, "List">>): void {
		Object.keys(msg.List).forEach(room => {
			Object.keys(msg.List[room]).forEach(user => {
				let cachedUser = this.addOrGetUser(user, room);
				let userMsg = msg.List[room][user];
				cachedUser.file = this.isEmptyObject(userMsg.file) ? undefined : userMsg.file;
				cachedUser.position = userMsg.position;
				cachedUser.controller = userMsg.controller == undefined ? false : userMsg.controller;
				cachedUser.isReady = userMsg.isReady;
				// TODO: use userMsg.features?
			});
		});
		this.usersUpdated.emit(this._cachedUsers);
	}

	private parseState(msg: Required<Pick<SyncplayResponse, "State">>): void {
		let messageAge = 0;
		if (msg.State.ignoringOnTheFly && msg.State.ignoringOnTheFly.server) {
			this.serverIgnoringOnTheFly = msg.State.ignoringOnTheFly.server;
			this.clientIgnoringOnTheFly = 0;
			this.stateChanged = false;
		}
		if (msg.State.playstate) {
			// TODO: store currentUser instead of currentUsername???
			if (msg.State.playstate.setBy && msg.State.playstate.setBy != this._currentUsername) {
				let cachedUser = this.addOrGetUser(msg.State.playstate.setBy);
				if (this.updateToServer || (msg.State.playstate.doSeek && !this.doSeek)) {
					this.seek.emit(msg.State.playstate.position, cachedUser);
					this.updateToServer = false;
				}
				if (this.paused != msg.State.playstate.paused) {
					if (msg.State.playstate.paused) {
						this.pause.emit(cachedUser);
						this.paused = true;
					} else {
						this.unpause.emit(cachedUser);
						this.paused = false;
					}
				}
			}
			if (msg.State.playstate.position) {
				this.serverPosition = msg.State.playstate.position;
			}
		}
		if (msg.State.ping) {
			if (msg.State.ping.latencyCalculation) {
				this.latencyCalculation = msg.State.ping.latencyCalculation;
			}
			if (msg.State.ping.clientLatencyCalculation) {
				this.pingService.receiveMessage(msg.State.ping.clientLatencyCalculation, msg.State.ping.serverRtt);
			}
			messageAge = this.pingService.getLastForwardDelay();
		}

		// update position due to message delays
		if (!this.paused) {
			this.serverPosition += messageAge;
		}

		// compare server position and client position, ffwd/rewind etc.
	}

	private parseChat(msg: Required<Pick<SyncplayResponse, "Chat">>): void {
		this.chat.emit(this.addOrGetUser(msg.Chat.username), msg.Chat.message);
	}

	private sendState(): void {
		const clientIgnoreIsNotSet = this.clientIgnoringOnTheFly == 0 || this.serverIgnoringOnTheFly != 0;

		let wasDoSeek = false;
		if (this.doSeek) {
			wasDoSeek = true;
			this.doSeek = false;
		}
		const playstate = clientIgnoreIsNotSet
			? {
					position: this.currentPosition,
					paused: this.paused,
					doSeek: wasDoSeek
			  }
			: undefined;

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
