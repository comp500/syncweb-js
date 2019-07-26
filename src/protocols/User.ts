import SyncplayFile from "./messages/SyncplayFile";

export default class User {
	file?: SyncplayFile

	constructor(public name: string) {}
}