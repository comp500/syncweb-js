import ClientFeatures from "./ClientFeatures";
import SyncplayFile from "./SyncplayFile";
import ServerFeatures from "./ServerFeatures";

export default class SyncplayResponse {
	Hello?: {
		username: string,
		version: string, // Is always the same as the version you send
		realversion: string,
		motd: string,
		room: {
			name: string
		},
		features: ServerFeatures
	}
	Error?: {
		message: string
	}
	Set?: {
		user?: {
			[username: string]: {
				room: {
					name: string
				},
				event?: {
					joined?: boolean,
					left?: boolean
				},
				file?: SyncplayFile
			}
		},
		ready?: {
			username: string,
			manuallyInitiated: boolean,
			isReady: boolean | null
		},
		playlistChange?: {
			files: SyncplayFile[],
			user: string | null
		},
		playlistIndex?: {
			index: number | null,
			user: string | null
		}
	}
	List?: {
		[room: string]: {
			[username: string]: {
				position?: number,
				file: SyncplayFile | {},
				controller?: boolean,
				features?: ClientFeatures,
				isReady?: boolean
			}
		}
	}
	State?: {
		ping?: {
			serverRtt: number,
			latencyCalculation: number,
			clientLatencyCalculation: number
		},
		playstate?: {
			position: number,
			doSeek: boolean,
			paused: boolean,
			setBy: string
		}
		// TODO: FIGURE OUT WHAT IGNORING ON THE FLY IS AGAIN
		ignoringOnTheFly?: {
			client?: number
			server?: number
		}
	};
	Chat?: {
		username: string,
		message: string
	};
	// TLS??

	// Type guards
	static hasError(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "Error">> & SyncplayResponse {
		return msg.Error != undefined;
	}

	static hasHello(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "Hello">> & SyncplayResponse {
		return msg.Hello != undefined;
	}

	static hasSet(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "Set">> & SyncplayResponse {
		return msg.Set != undefined;
	}

	static hasList(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "List">> & SyncplayResponse {
		return msg.List != undefined;
	}

	static hasState(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "State">> & SyncplayResponse {
		return msg.State != undefined;
	}

	static hasChat(msg: SyncplayResponse): msg is Required<Pick<SyncplayResponse, "Chat">> & SyncplayResponse {
		return msg.Chat != undefined;
	}
}