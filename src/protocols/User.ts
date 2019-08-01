import SyncplayFile from "./messages/SyncplayFile";

export default class User {
	file?: SyncplayFile

	isReady?: boolean
	// TODO: should this be exposed?
	manuallyInitiated?: boolean
	// TODO: is this reliably provided?
	position?: number
	// TODO: how should this be used?
	controller = false

	constructor(public name: string, public room?: string) {}
}