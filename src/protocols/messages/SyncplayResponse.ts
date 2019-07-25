import ClientFeatures from "./ClientFeatures";
import SyncplayFile from "./SyncplayFile";

export default class Response {
	Hello?: {
		username: string,
		version: string, // Is always the same as the version you send
		realversion: string,
		motd: string,
		room: {
			name: string
		},
		features: {
			maxUsernameLength?: number,
			chat?: boolean,
			maxChatMessageLength?: number,
			maxFilenameLength?: number,
			isolateRooms?: boolean,
			managedRooms?: boolean,
			readiness?: boolean,
			maxRoomNameLength?: number
		}
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
}