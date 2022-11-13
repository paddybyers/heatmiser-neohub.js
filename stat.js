const events = require('events');

const { NeoCommand } = require('./protocol');
const { NeoDevice } = require('./device');
const { Logger } = require('./log');

class NeoStat extends NeoDevice {
	constructor(zoneName, protocol, deviceId) {
		super(zoneName, protocol, deviceId);
	}

	async getTempLog() {
		const log = this.log.with({action: 'getTempLog'});
		log.info();
		const cmd = new NeoCommand('GET_TEMPLOG', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setDifferential(diff) {
		const log = this.log.with({action: 'setDifferential'});
		log.info();
		const cmd = new NeoCommand('SET_DIFF', [diff, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setFloorMax(floor) {
		const log = this.log.with({action: 'setFloorMax'});
		log.info();
		const cmd = new NeoCommand('SET_FLOOR', [floor, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setPreheat(preheat) {
		const log = this.log.with({action: 'setPreheat'});
		log.info();
		const cmd = new NeoCommand('SET_PREHEAT', [preheat, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setFrost(frost) {
		const log = this.log.with({action: 'setFrost'});
		log.info();
		const cmd = new NeoCommand('SET_PREHEAT', [frost, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setDelay(delay) {
		const log = this.log.with({action: 'setDelay'});
		log.info();
		const cmd = new NeoCommand('SET_DELAY', [delay, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async hold() {
		const log = this.log.with({action: 'hold'});
		log.info();
		const cmd = new NeoCommand('HOLD', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async lock(pin) {
		const log = this.log.with({action: 'lock'});
		log.info();
		const cmd = new NeoCommand('LOCK', [pin, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async unlock() {
		const log = this.log.with({action: 'unlock'});
		log.info();
		const cmd = new NeoCommand('UNLOCK', [this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTemp(temp) {
		const log = this.log.with({action: 'setTemp'});
		log.info();
		const cmd = new NeoCommand('SET_TEMP', [temp, this.deviceName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	inspect() {
		const res = super.inspect();
		res.deviceId = this.liveStatus.device_id;
		res.setTemp = this.liveStatus.set_temp;
		res.currentTemp = this.liveStatus.actual_temp;
		res.activeProfile = this.liveStatus.active_profile;
		res.heatOn = this.liveStatus.heat_on;
		res.holdOn = this.liveStatus.hold_on;
		res.standby = this.liveStatus.standby;
		res.offline = this.liveStatus.offline;
		res.recentTemps = this.liveStatus.recent_temps.slice(0, 4).join(', ');
		return res;
	}

	synopsis() {
		const res = super.synopsis();
		res.setTemp = this.liveStatus.set_temp;
		res.currentTemp = this.liveStatus.actual_temp;
		res.activeProfile = this.liveStatus.active_profile;
		res.heatOn = this.liveStatus.heat_on;
		return res;
	}
}

exports.NeoStat = NeoStat;
