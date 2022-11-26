const events = require('events');

const { NeoConnection, NeoDiscovery, NeoHubAddress } = require('./connection');
const { NeoProtocol, NeoCommand } = require('./protocol');
const { SystemConfig, SystemTimestamps, SystemLiveStatus, DeviceID, DeviceIDList, EngineersStatus, DeviceLiveStatus } = require('./protocol_types');
const { Profile, DeviceProfile, NamedProfile } = require('./profile');
const { NeoPlug } = require('./plug');
const { NeoStat } = require('./stat');
const { Logger } = require('./log');
const { arrayDiff } = require('./util');

class NeoHub extends events.EventEmitter {
	constructor(hubId, protocol, metrics) {
		super();
		this.log = Logger.get().withType(this).with({hubId});
		this.hubId = hubId;
		this.protocol = protocol;
		this.zoneStats = new Map();
		this.plugs = new Map();
		this.systemTimestamps = new SystemTimestamps();
		this.systemLiveStatus = new SystemLiveStatus();
		this.systemConfig = new SystemConfig();
		this.definedProfiles = new Map();
		if(metrics) {
			this.initMetrics(metrics);
		}
	}

	initMetrics(metrics) {
		this.metrics = metrics;
		this.metricsLabels = Object.assign({hubId: this.hubId.deviceId}, this.metrics.defaultLabels);
		metrics.addGauge('ntp', 'ntp running status', ['hubId']);
		metrics.addGauge('away', 'hub away status', ['hubId']);
		metrics.addGauge('holiday', 'hub holiday status', ['hubId']);
	}

	updateMetrics() {
		this.metrics.setGauge('ntp', (this.systemConfig.ntp_on === 'Running') * 1, this.metricsLabels);
		this.metrics.setGauge('away', this.systemLiveStatus.hub_away * 1, this.metricsLabels);
		this.metrics.setGauge('holiday', this.systemLiveStatus.hub_holiday * 1, this.metricsLabels);
	}

	/***************************************
	 *            Hub management
	 ***************************************/

	 async updateNetwork() {
		const log = this.log.with({action: 'updateNetwork'});
		log.debug();
		try {
			const getLiveDataResponse = await this.getLiveData();
			log.info('got liveData response');
			log.trace('liveData response', {getLiveDataResponse});

			/* process all the timestamps */
			const responseTimestamps = SystemTimestamps.fromJSON(getLiveDataResponse);
			const existingTimestamps = this.systemTimestamps;
			log.debug('comparing timestamps', {existingTimestamps, responseTimestamps});

			/* system config: returned timestamp from Hub is always 0,
			 * so get system config unconditionally */
			log.debug('getting system config');
		 	this.systemConfig = SystemConfig.fromJSON(await this.getSystem());

			if(existingTimestamps.timestamp_device_lists < responseTimestamps.timestamp_device_lists) {
				log.debug('stale device lists; updating zones');
			 	const responseZones = await this.getZones(),
			 		responseZoneNames = Object.keys(responseZones),
			 		existingZoneNames = Array.from(this.zoneStats.keys()),
			 		[newZones, deletedZones, remainingZones] = arrayDiff(responseZoneNames, existingZoneNames);

				log.trace('response zones', {responseZones});
			 	for(const zoneName of newZones) {
			 		const deviceId = DeviceID.fromJSON(zoneName, responseZones[zoneName]),
						zoneStat = new NeoStat(zoneName, this, this.protocol, deviceId, this.metrics);

			 		this.zoneStats.set(zoneName, zoneStat);
					log.info('added stat', {zoneName});
					log.trace('stat', {zoneStat});
			 	}
			 	for(const zoneName of deletedZones) {
			 		this.zoneStats.clear(zoneName);
					log.info('removed stat', {zoneName});
			 	}

				log.debug('stale device lists; updating devices');
			 	const responseDeviceNames = await this.getDevices(),
			 		existingDeviceNames = Array.from(this.plugs.keys()),
			 		[newDevices, deletedDevices, remainingDevices] = arrayDiff(responseDeviceNames, existingDeviceNames);

				log.debug('updating devices', {responseDeviceNames, existingDeviceNames, newDevices, deletedDevices, remainingDevices});
			 	for(const deviceName of newDevices) {
			 		const deviceId = DeviceID.fromJSON(deviceName, responseDevices[deviceName]),
						plug = new NeoPlug(deviceName, this, this.protocol, deviceId, this.metrics);

			 		this.plugs.set(deviceName, plug);
					log.info('added plug', {deviceName});
					log.trace('plug', {plug});
			 	}
			 	for(const deviceName of deletedDevices) {
			 		this.plugs.clear(deviceName);
					log.info('removed plug', {deviceName});
			 	}
			}

			if(existingTimestamps.timestamp_engineers < responseTimestamps.timestamp_engineers) {
				log.debug('stale engineers status; updating');
			 	const responseEngineers = await this.getEngineers();
			 	for(const deviceName of this.zoneStats.keys()) {
			 		this.log.debug('updating engineersStatus for zone', {deviceName});
			 		const updatedEngineersStatus = EngineersStatus.fromJSON(responseEngineers[deviceName]);
			 		this.log.trace('engineersStatus for zone', {updatedEngineersStatus});
			 		this.zoneStats.get(deviceName).engineersStatus = updatedEngineersStatus;
			 	}
			 	for(const deviceName of this.plugs.keys()) {
			 		this.log.debug('updating engineersStatus for plug', {deviceName});
			 		const updatedEngineersStatus = EngineersStatus.fromJSON(responseEngineers[deviceName]);
			 		this.log.trace('engineersStatus for plug', {updatedEngineersStatus});
			 		this.plugs.get(deviceName).engineersStatus = updatedEngineersStatus;
			 	}
			}

			if(existingTimestamps.timestamp_profile_0 < responseTimestamps.timestamp_profile_0) {
				log.debug('stale profile0 status; updating');
				for(const deviceName of this.zoneStats.keys()) {
					const device = this.zoneStats.get(deviceName);
					try {
						const updatedProfile0 = DeviceProfile.fromJSON(await device.getProfile0());
						this.log.debug('updating profile0 for zone', {deviceName, updatedProfile0});
						device.profile0 = updatedProfile0;
					} catch(err) {
						this.log.error('unable to read profile0', {deviceName, err});
					}
				}
				for(const deviceName of this.plugs.keys()) {
					const device = this.plugs.get(deviceName);
					try {
						const updatedProfile0 = Profile.fromJSON(await device.getProfile0());
						this.log.debug('updating profile0 for plug', {deviceName, updatedProfile0});
						device.profile0 = updatedProfile0;
					} catch(err) {
						this.log.error('unable to read profile0', {deviceName, err});
					}
				}
			}

			/* update hub and all devices with the contents of the live data response */
			this.systemLiveStatus = SystemLiveStatus.fromJSON(getLiveDataResponse);
			const liveDevicesResponse = getLiveDataResponse.devices;
			for(const liveDeviceResponse of liveDevicesResponse) {
				const deviceName = liveDeviceResponse.ZONE_NAME;
				if(this.zoneStats.has(deviceName)) {
			 		const device = this.zoneStats.get(deviceName);
			 		const liveStatus = device.liveStatus = DeviceLiveStatus.fromJSON(liveDeviceResponse);
			 		this.log.debug('updating live status for zone', {deviceName});
			 		this.log.trace('live status for zone', {liveStatus});
				} else if(this.plugs.has(deviceName)) {
			 		const device = this.plugs.get(deviceName);
			 		const liveStatus = device.liveStatus = DeviceLiveStatus.fromJSON(liveDeviceResponse);
			 		this.log.debug('updating live status for device', {deviceName});
			 		this.log.trace('live status for device', {liveStatus});
				}
			}

			if(existingTimestamps.timestamp_profile_comfort_levels < responseTimestamps.timestamp_profile_comfort_levels) {
				log.debug('stale stored profiles; updating');

			 	const responseProfiles = await this.getProfiles(),
			 		responseProfileNames = Object.keys(responseProfiles),
			 		existingProfileNames = Array.from(this.definedProfiles.keys()),
			 		[newProfiles, deletedProfiles, remainingProfiles] = arrayDiff(responseProfileNames, existingProfileNames);

			 	for(const profileName of newProfiles) {
			 		const profile = NamedProfile.fromJSON(responseProfiles[profileName]);
			 		this.definedProfiles.set(profileName, profile);
					log.info('added profile', {profileName});
					log.trace('profile', {profile});
			 	}
			 	for(const profileName of remainingProfiles) {
			 		const profile = NamedProfile.fromJSON(responseProfiles[profileName]);
			 		this.definedProfiles.set(profileName, profile);
					log.info('updated profile', {profileName});
					log.trace('profile', {profile});
			 	}
			 	for(const profileName of deletedProfiles) {
			 		this.definedProfiles.clear(profileName);
					log.info('removed profile', {profileName});
			 	}
			}

			/* no support for timeclocks atm
			 * ignore TIMESTAMP_PROFILE_TIMERS, TIMESTAMP_PROFILE_TIMERS_0
			 */

			if(this.metrics) {
				this.updateMetrics();
				for(const device of this.zoneStats.values()) {
					device.updateMetrics();
				}
				for(const device of this.plugs.values()) {
					device.updateMetrics();
				}
			}
		} catch(err) {
			log.error('error response', {err});
			throw err;
		}
	 }

	/***************************************
	 *         Hub-scoped commands
	 ***************************************/

	async reboot() {
		const log = this.log.with({action: 'reboot'});
		log.info();
		const cmd = new NeoCommand('RESET', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async identify() {
		const log = this.log.with({action: 'identify'});
		log.info();
		const cmd = new NeoCommand('IDENTIFY', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setChannel(channel) {
		const log = this.log.with({action: 'setChannel'});
		log.info();
		switch(channel) {
			case 11:
			case 14:
			case 15:
			case 19:
			case 20:
			case 20:
			case 24:
			case 25:
				break;
			default:
				this.log.warn('setChannel: invalid', {channel});
				throw 'Invalid channel: ' + channel;
		}
		const cmd = new NeoCommand('SET_CHANNEL', [channel]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTempFormat(format) {
		const log = this.log.with({action: 'setTempFormat'});
		log.info();
		switch(format) {
			case "C":
			case "F":
				break;
			default:
			this.log.warn('NeoHub().setTempFormat: invalid', format);
				throw 'Invalid temp format: ' + format;
				return;
		}
		const cmd = new NeoCommand('SET_TEMP_FORMAT', [format]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setFormat(format) {
		const log = this.log.with({action: 'setFormat'});
		log.info();
		switch(format) {
			case "NONPROGRAMMABLE":
			case "24HOURSFIXED":
			case "5DAY/2DAY":
			case "7DAY":
				break;
			default:
				this.log.warn('NeoHub().setFormat: invalid', format);
				throw 'Invalid format: ' + format;
		}
		const cmd = new NeoCommand('SET_FORMAT', [format]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setAway(away, args) {
		const log = this.log.with({action: 'setAway', away});
		log.info();
		const cmdName = away ? 'AWAY_ON ' : 'AWAY_OFF';
		const cmd = new NeoCommand(cmdName, args);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setHoliday(startDate, endDate) {
		const log = this.log.with({action: 'setHoliday', startDate, endDate});
		log.info();
		const args = [startDate, endDate];
		/* TODO: convert from date to HHMMSSDDMMYYYY format
		 * const mappedArgs = args.map(convert);
		 */
		const cmd = new NeoCommand('HOLIDAY', args);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getHoliday() {
		const log = this.log.with({action: 'getHoliday'});
		log.info();
		const cmd = new NeoCommand('GET_HOLIDAY', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async cancelHoliday() {
		const log = this.log.with({action: 'cancelHoliday'});
		log.info();
		const cmd = new NeoCommand('CANCEL_HOLIDAY', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getSystem() {
		const log = this.log.with({action: 'getSystem'});
		log.info();
		const cmd = new NeoCommand('GET_SYSTEM', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getLiveData() {
		const log = this.log.with({action: 'getLiveData'});
		log.info();
		const cmd = new NeoCommand('GET_LIVE_DATA', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getZones() {
		const log = this.log.with({action: 'getZones'});
		log.info();
		const cmd = new NeoCommand('GET_ZONES', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getDevices() {
		const log = this.log.with({action: 'getDevices'});
		log.info();
		const cmd = new NeoCommand('GET_DEVICES', []);
		try {
			const resp = await this.protocol.sendCommand(cmd);
			return resp.result;
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getDeviceList(roomName) {
		const log = this.log.with({action: 'getDevices'});
		log.info();
		const cmd = new NeoCommand('GET_DEVICE_LIST', [roomName]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getDevicesSN() {
		const log = this.log.with({action: 'getDevicesSN'});
		log.info();
		const cmd = new NeoCommand('DEVICES_SN', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getEngineers() {
		const log = this.log.with({action: 'getEngineers'});
		log.info();
		const cmd = new NeoCommand('GET_ENGINEERS', []);

		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getFirmware() {
		const log = this.log.with({action: 'getFirmware'});
		log.info();
		const cmd = new NeoCommand('GET_FIRMWARE', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setNTP(ntp) {
		const log = this.log.with({action: 'setNTP', ntp});
		log.info();
		const cmdName = ntp ? 'NTP_ON ' : 'NTP_OFF';
		const cmd = new NeoCommand(cmdName, []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setDate(date) {
		const log = this.log.with({action: 'setDate'});
		log.info();
		/* TODO: convert date to [Y, M, D] format
		 */
		const cmd = new NeoCommand('SET_DATE', [date]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTime(date) {
		const log = this.log.with({action: 'setDate'});
		log.info();
		/* TODO: convert time to [H, M] format
		 */
		const cmd = new NeoCommand('SET_TIME', [date]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setTimezone(tz) {
		const log = this.log.with({action: 'setTimezone'});
		log.info();
		/* TODO: validate TZ offset
		 */
		const cmd = new NeoCommand('TIME_ZONE', [tz]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setManualDST(dst) {
		const log = this.log.with({action: 'setManualDST', dst});
		log.info();
		const cmd = new NeoCommand(cmdName, [dst ? 1 : 0]);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setDST(dst) {
		const log = this.log.with({action: 'setDST', dst});
		log.info();
		const cmdName = dst ? 'DST_ON ' : 'DST_OFF';
		const cmd = new NeoCommand(cmdName, []);
		try {
			const res = await this.protocol.sendCommand(cmd);
			this.log.trace('response', {res});
			if(!dst) {
				await setManualDST(0);
			}
			return res;
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getProfileNames() {
		const log = this.log.with({action: 'getProfileNames'});
		log.info();
		const cmd = new NeoCommand('GET_PROFILE_NAMES', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async getProfiles() {
		const log = this.log.with({action: 'getProfiles'});
		log.info();
		const cmd = new NeoCommand('GET_PROFILES', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setLevel4() {
		const log = this.log.with({action: 'setLevel4'});
		log.info();
		const cmd = new NeoCommand('SET_LEVEL_4', []);
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	async setLevel6() {
		const log = this.log.with({action: 'setLevel6'});
		log.info();
		try {
			return await this.protocol.sendCommand(cmd);
		} catch(err) {
			this.log.error('error', {err});
			throw err;
		}
	}

	inspect() {
		return {
			deviceId: this.hubId.deviceId,
			address: this.hubId.address,
			hubType: this.systemConfig.hub_type,
			hubVersion: this.systemConfig.hub_version,
			ntp: this.systemConfig.ntp_on,
			away: this.systemLiveStatus.hub_away,
			holiday: this.systemLiveStatus.hub_holiday,
			time: this.systemLiveStatus.hub_time
		};
	}
}

exports.NeoHub = NeoHub;
