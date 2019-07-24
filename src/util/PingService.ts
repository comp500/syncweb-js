export default class PingService {
	private pingMovingAverageWeight = 0.85;
	private roundTripTime = 0;
	private forwardDelay = 0;
	private averageRTT = 0;

	// Directly ported from python implementation
	receiveMessage(timestamp: number, senderRTT: number): void {
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

	getLastForwardDelay(): number {
		return this.forwardDelay;
	}

	getRTT(): number {
		return this.roundTripTime;
	}
}