import ClientFeatures from "./ClientFeatures";
import SyncplayFile from "./SyncplayFile";

export default class SyncplayRequest {
	Hello?: {
		username: string,
		password?: string,
		room: {
			name: string
		},
		version: "1.2.255",
		realversion: "1.6.4", // the mark of a well designed protocol
		features: ClientFeatures
	};
	Set?: {
		file?: SyncplayFile,
		ready?: {
			isReady: boolean,
			manuallyInitiated: boolean,
			// Is this used?
			username?: string
		}
	};
	// null List denotes a list request
	List?: null;
	State?: {
		playstate?: {
			position: number,
			paused: boolean,
			doSeek: boolean
		},
		ping: {
			latencyCalculation?: number,
			clientLatencyCalculation: number,
			clientRtt: number
		}
		// TODO: FIGURE OUT WHAT IGNORING ON THE FLY IS AGAIN
		ignoringOnTheFly?: {
			client?: number
			server?: number
		}
	};
	Chat?: string;
	// TLS??

	static setFile(file: SyncplayFile): SyncplayRequest {
		const req = new SyncplayRequest();
		req.Set = {file};
		return req;
	}

	static setReady(ready: boolean, manual: boolean, username: string): SyncplayRequest {
		const req = new SyncplayRequest();
		req.Set = {
			ready: {
				isReady: ready,
				manuallyInitiated: manual,
				username
			}
		};
		return req;
	}

	static state(ping: {
		latencyCalculation?: number,
		clientLatencyCalculation: number,
		clientRtt: number
	}, ignoringOnTheFlyClient?: number,
	ignoringOnTheFlyServer?: number,
	playstate?: {
		position: number,
		paused: boolean,
		doSeek: boolean
	}): SyncplayRequest {
		const req = new SyncplayRequest();
		req.State = {
			ping,
			ignoringOnTheFly: (ignoringOnTheFlyClient == undefined && ignoringOnTheFlyServer == undefined) ? undefined : {
				client: ignoringOnTheFlyClient,
				server: ignoringOnTheFlyServer
			},
			playstate
		};
		return req;
	}

	static hello(username: string, room: string, password?: string): SyncplayRequest {
		const req = new SyncplayRequest();
		req.Hello = {
			username,
			password,
			room: {
				name: room
			},
			version: "1.2.255",
			realversion: "1.6.4",
			features: ClientFeatures.all()
		};
		return req;
	}

	static requestList(): SyncplayRequest {
		const req = new SyncplayRequest();
		req.List = null;
		return req;
	}
}