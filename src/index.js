import Client from "./Client";
import Serializer from "./Serializer";

const SyncPlay = {};
SyncPlay.Client = Client;
SyncPlay.Serializer = Serializer;

export default SyncPlay;
window.SyncPlay = SyncPlay;