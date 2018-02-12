class PingService {
	constructor() {
		this.pingMovingAverageWeight = 0.85;
		this.roundTripTime = 0;
		this.forwardDelay = 0;
		this.averageRTT = 0;
	}

	// Directly ported from python implementation
	receiveMessage(timestamp, senderRTT) {
		if (!timestamp) return;

		this.roundTripTime = (Date.now() / 1000) - timestamp;

		if (this.roundTripTime < 0 || senderRTT < 0) return;

		if (!this.averageRTT) {
			this.averageRTT = this.roundTripTime;
		}
		// Add to moving average
		this.averageRTT = (this.averageRTT * this.pingMovingAverageWeight) + (this.roundTripTime * (1 - this.pingMovingAverageWeight));

		if (senderRTT < this.roundTripTime) {
			this.forwardDelay = (this.averageRTT / 2) + (this.roundTripTime - senderRTT);
		} else {
			this.forwardDelay = this.averageRTT / 2;
		}
	}

	getLastForwardDelay() {
		return this.forwardDelay;
	}

	getRTT() {
		return this.roundTripTime;
	}
}

SyncWeb.util.PingService = PingService;