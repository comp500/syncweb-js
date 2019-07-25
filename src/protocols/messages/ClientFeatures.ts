export default class ClientFeatures {
	sharedPlaylists?: true
	chat?: true
	featureList?: true
	readiness?: true
	managedRooms?: true

	static all(): ClientFeatures {
		return {
			sharedPlaylists: true,
			chat: true,
			featureList: true,
			readiness: true,
			managedRooms: true
		};
	}
}