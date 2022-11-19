const events = require('events');

const { NeoCommand } = require('./protocol');
const { Logger } = require('./log');

class NeoDevice extends events.EventEmitter {
	constructor(deviceName, hub, protocol, deviceId, metrics) {
		super();
		this.log = Logger.get().withType(this).with({deviceName});
		this.deviceName = deviceName;
		this.hub = hub;
		this.protocol = protocol;
		this.deviceId = deviceId;

		this.liveStatus = undefined;
		this.engineersStatus = undefined;
		this.profile0 = undefined;
		if(metrics) {
			this.initMetrics(metrics);
		}
	}

	initMetrics(metrics) {
		this.metrics = metrics;
		this.metricsLabels = Object.assign({deviceName: this.deviceName, hubId: this.hub.hubId.deviceId}, metrics.defaultLabels);
	}

	updateMetrics() {
	}

	async identify() {
		const log = this.log.with({action: 'identify'});
		log.info();
		const cmd = new NeoCommand('IDENTIFY_DEV', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getProfile0() {
		const log = this.log.with({action: 'getProfile0'});
		log.info();
		const cmd = new NeoCommand('GET_PROFILE_0', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getTimer0() {
		const log = this.log.with({action: 'getTimer0'});
		log.info();
		const cmd = new NeoCommand('GET_TIMER_0', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setProfile0(profile) {
		const log = this.log.with({action: 'setProfile0'});
		log.info();
		const cmd = new NeoCommand('STORE_PROFILE_0', [profile, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTimer0(profile) {
		const log = this.log.with({action: 'setTimer0'});
		log.info();
		const cmd = new NeoCommand('STORE_TIMER_0', [profile, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getHoursRun() {
		const log = this.log.with({action: 'getHoursRun'});
		log.info();
		const cmd = new NeoCommand('GET_HOURSRUN', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setFrostOn() {
		const log = this.log.with({action: 'setFrostOn'});
		log.info();
		const cmd = new NeoCommand('FROST_ON', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setFrostOff() {
		const log = this.log.with({action: 'setFrostOff'});
		log.info();
		const cmd = new NeoCommand('FROST_OFF', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	inspect() {
		return {};
	}

	synopsis() {
		return {};
	}
}

exports.NeoDevice = NeoDevice;
