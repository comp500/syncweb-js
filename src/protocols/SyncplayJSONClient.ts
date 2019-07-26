import WebSocketProtocol from "./WebSocketProtocol";
import JSONMessageProtocol from "./JSONMessageProtocol";
import PingService from "../util/PingService";
import EventTracker from "../util/EventTracker";
import SyncplayFile from "./messages/SyncplayFile";
import SyncplayRequest from "./messages/SyncplayRequest";
import SyncplayResponse from "./messages/SyncplayResponse";
import Room from "./Room";
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

	private _cachedRooms: Room[] = [];
	getAllRooms(): Room[] {
		return this._cachedRooms;
	}
	getRoom(name: string): Room | undefined {
		let roomFound: Room | undefined;
		this._cachedRooms.forEach(room => {
			if (room.name == name) {
				roomFound = room;
				// TODO: break out early?
			}
		});
		return roomFound;
	}
	addUserToRoom(user: string, roomName: string) {
		// Remove the user from existing rooms, in case the user moved
		let i = this._cachedRooms.length;
		while (i--) {
			this._cachedRooms[i].removeUserAndSelf(user);
		}
		let done = false;
		this._cachedRooms.forEach(room => {
			if (room.name == roomName && !done) {
				room.addUser(user);
				done = true;
				// TODO: break out early?
			}
		});
		if (!done) {
			const room = new Room(roomName, this._cachedRooms);
			room.addUser(user);
			this._cachedRooms.push(room);
		}
	}
	removeUserFromRoom(user: string, roomName: string) {
		let room = this.getRoom(roomName);
		if (room != undefined) {
			room.removeUserAndSelf(user);
		}
	}
	roomHasUser(user: string, roomName: string): boolean {
		let room = this.getRoom(roomName);
		if (room != undefined) {
			return room.getUser(user) != undefined;
		}
		return false;
	}
	getUser(username: string): User | undefined {
		this._cachedRooms.forEach(room => {
			let user = room.getUser(username);
			if (user != undefined) {
				return user;
			}
		});
		return undefined;
	}

	readonly connected = new EventTracker<(connectedString: string) => void>();
	readonly joined = new EventTracker<(userName: string, roomName: string) => void>();
	readonly left = new EventTracker<(userName: string, roomName: string) => void>();
	readonly moved = new EventTracker<(userName: string, roomName: string) => void>();
	readonly roomsUpdated = new EventTracker<(rooms: Room[]) => void>();
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
						this.joined.emit(key, user.room.name);
						this.addUserToRoom(key, user.room.name);
					}
					if (user.event.left) {
						this.left.emit(key, user.room.name);
						this.removeUserFromRoom(key, user.room.name);
					}
				} else {
					if (!this.roomHasUser(key, user.room.name)) {
						// user has moved
						this.addUserToRoom(key, user.room.name);
						this.moved.emit(key, user.room.name);
					}
				}
				if (user.file) {
					let room = this.getRoom(user.room.name);
					if (room != undefined) {
						let cachedUser = room.getUser(key);
						if (cachedUser != undefined) {
							cachedUser.file = user.file;
						}
					}
				}
				this.roomsUpdated.emit(this._cachedRooms);
			});
		}

		// TODO:
		// Here, we don't have the room name
		// so make either:
		// 1. Users reference room names, User list is stored
		// -- Probably easiest to implement and smallest code size
		// 2. Do nothing when a non-room user is given (coherent with UI/existing impls?)
		// 3. Store both room and user lists
		// actually nvm just do option 1 lol
		if (msg.Set.ready) {
			if (!this.roomdetails[]) {
				this.addUserToRoom()
				this.roomdetails[msg.Set.ready.username] = {};
			}
			this.roomdetails[msg.Set.ready.username].isReady = msg.Set.ready.isReady;
			this.roomdetails[msg.Set.ready.username].manuallyInitiated = msg.Set.ready.manuallyInitiated;

			this.roomsUpdated.emit(this._cachedRooms);
		}

		// to implement:
		// room, controllerAuth, newControlledRoom, playlistIndex, playlistChange
	}

	private parseList(msg: Required<Pick<SyncplayResponse, "List">>): void {
		this._cachedRooms = [];
		Object.keys(msg.List).forEach(room => {
			Object.keys(msg.List[room]).forEach(user => {
				this.roomdetails[user] = msg.List[room][user];
				this.roomdetails[user].room = room;
			});
		});
		this.roomsUpdated.emit(this._cachedRooms);
	}

	private parseState(msg: Required<Pick<SyncplayResponse, "State">>): void {
		let messageAge = 0;
		if (msg.State.ignoringOnTheFly && msg.State.ignoringOnTheFly.server) {
			this.serverIgnoringOnTheFly = msg.State.ignoringOnTheFly.server;
			this.clientIgnoringOnTheFly = 0;
			this.stateChanged = false;
		}
		if (msg.State.playstate) {
			if (msg.State.playstate.setBy && msg.State.playstate.setBy != this._currentUsername) {
				if (this.updateToServer || (msg.State.playstate.doSeek && !this.doSeek)) {
					this.seek.emit(msg.State.playstate.position, msg.State.playstate.setBy);
					this.updateToServer = false;
				}
				if (this.paused != msg.State.playstate.paused) {
					if (msg.State.playstate.paused) {
						this.pause.emit(msg.State.playstate.setBy);
						this.paused = true;
					} else {
						this.unpause.emit(msg.State.playstate.setBy);
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
		this.chat.emit(msg.Chat.username, msg.Chat.message);
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
