const events = require('events');

const { NeoCommand } = require('./protocol');
const { NeoDevice } = require('./device');
const { Logger } = require('./log');

class NeoPlug extends NeoDevice {
	constructor(deviceName, hub, protocol, deviceId, metrics) {
		super(deviceName, hub, protocol, deviceId, metrics);
		this.initMetrics(metrics);
	}

	initMetrics(metrics) {
		super.initMetrics(metrics);
	}

	async setTimedHoldOn(minutes) {
		const log = this.log.with({action: 'setTimedHoldOn'});
		log.info();
		const cmd = new NeoCommand('TIMER_HOLD_ON', [minutes, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTimedHoldOff(minutes) {
		const log = this.log.with({action: 'setTimedHoldOff'});
		log.info();
		const cmd = new NeoCommand('TIMER_HOLD_OFF', [minutes, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	inspect() {
		const res = super.inspect();
		return res;
	}

	synopsis() {
		const res = super.synopsis();
		return res;
	}
}

exports.NeoPlug = NeoPlug;
