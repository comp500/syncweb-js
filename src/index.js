/* global SYNCPLAYEXPORT */

import Client from "./Client";
import Serializer from "./Serializer";
import Deserializer from "./Deserializer";

const SyncPlay = {};
SyncPlay.Client = Client;
SyncPlay.Serializer = Serializer;
SyncPlay.Deserializer = Deserializer;

export default SyncPlay;

if (SYNCPLAYEXPORT) {
	window.SyncPlay = SyncPlay;
}