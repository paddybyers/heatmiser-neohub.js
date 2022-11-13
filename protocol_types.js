class SystemConfig {
	constructor() {
		this.alt_timer_format = undefined;
		this.corf = undefined;
		this.device_id = undefined;
		this.dst_auto = undefined;
		this.dst_on = undefined;
		this.format = undefined;
		this.heating_levels = undefined;
		this.heatorcool = undefined;
		this.hub_type = undefined;
		this.hub_version = undefined;
		this.ntp_on = undefined;
		this.partition = undefined;
		this.timestamp = undefined;
		this.time_zone = undefined;
		this.utc = undefined;
	}

	static fromJSON(resp) {
		console.log('SystemConfig.fromJSON', resp);
		const res = new SystemConfig();
		for(const key of Object.keys(res)) {
			res[key] = resp[key.toUpperCase()];
		}
		return res;
	}
}

class SystemTimestamps {
	constructor() {
		this.timestamp_device_lists = 0;
		this.timestamp_engineers = 0;
		this.timestamp_profile_0 = 0;
		this.timestamp_profile_comfort_levels = 0;
		this.timestamp_profile_timers = 0;
		this.timestamp_profile_timers_0 = 0;
		this.timestamp_system = 0;
	}

	static fromJSON(resp) {
		console.log('SystemTimestamps.fromJSON', resp);
		const res = new SystemTimestamps();
		for(const key of Object.keys(res)) {
			res[key] = resp[key.toUpperCase()];
		}
		return res;
	}
}

class SystemLiveStatus {
	constructor() {
		this.close_delay = undefined;
		this.cool_input = undefined;
		this.global_system_type = undefined;
		this.holiday_end = undefined;
		this.hub_away = undefined;
		this.hub_holiday = undefined;
		this.hub_time = undefined;
		this.open_delay = undefined;
	}

	static fromJSON(resp) {
		console.log('SystemLiveStatus.fromJSON', resp);
		const res = new SystemLiveStatus();
		for(const key of Object.keys(res)) {
			res[key] = resp[key.toUpperCase()];
		}
		return res;
	}
}

class DeviceLiveStatus {
	constructor() {
		this.active_level = undefined;
		this.active_profile = undefined;
		this.actual_temp = undefined;
		this.available_modes = undefined;
		this.away = undefined;
		this.cool_mode = undefined;
		this.cool_on = undefined;
		this.cool_temp = undefined;
		this.current_floor_temperature = undefined;
		this.date = undefined;
		this.device_id = undefined;
		this.fan_control = undefined;
		this.fan_speed = undefined;
		this.floor_limit = undefined;
		this.hc_mode = undefined;
		this.heat_mode = undefined;
		this.heat_on = undefined;
		this.hold_off = undefined;
		this.hold_on = undefined;
		this.hold_temp = undefined;
		this.hold_time = undefined;
		this.holiday = undefined;
		this.lock = undefined;
		this.low_battery = undefined;
		this.manual_off = undefined;
		this.modelock = undefined;
		this.modulation_level = undefined;
		this.offline = undefined;
		this.pin_number = undefined;
		this.preheat_active = undefined;
		this.recent_temps = undefined;
		this.set_temp = undefined;
		this.standby = undefined;
		this.switch_delay_left = undefined;
		this.temporary_set_flag = undefined;
		this.thermostat = undefined;
		this.time = undefined;
		this.timer_on = undefined;
		this.window_open = undefined;
		this.write_count = undefined;
		this.zone_name = undefined;
	}

	static fromJSON(resp) {
		// console.log('DeviceLiveStatus.fromJSON', resp);
		const res = new DeviceLiveStatus();
		for(const key of Object.keys(res)) {
			res[key] = resp[key.toUpperCase()];
		}
		return res;
	}
}

class EngineersStatus {
	constructor() {
		this.deadband = undefined;
		this.device_id = undefined;
		this.device_type = undefined;
		this.floor_limit = undefined;
		this.frost_temp = undefined;
		this.max_preheat = undefined;
		this.output_delay = undefined;
		this.pump_delay = undefined;
		this.rf_sensor_mode = undefined;
		this.stat_failsafe = undefined;
		this.stat_version = undefined;
		this.switching_differential = undefined;
		this.switch_delay = undefined;
		this.system_type = undefined;
		this.timestamp = undefined;
		this.user_limit = undefined;
		this.window_switch_open = undefined;
	}

	static fromJSON(resp) {
		// console.log('EngineersStatus.fromJSON', resp);
		const res = new DeviceLiveStatus();
		for(const key of Object.keys(res)) {
			res[key] = resp[key.toUpperCase()];
		}
		return res;
	}
}

class DeviceID {
	constructor(name, id, timestamp) {
		this.name = name;
		this.id = id;
		this.timestamp = timestamp;
	}

	static fromJSON(name, resp) {
		return new DeviceID(name, resp.DEVICE_ID, resp.TIMESTAMP);
	}
}

exports.SystemConfig = SystemConfig;
exports.SystemTimestamps = SystemTimestamps;
exports.SystemLiveStatus = SystemLiveStatus;
exports.DeviceLiveStatus = DeviceLiveStatus;
exports.EngineersStatus = EngineersStatus;
exports.DeviceID = DeviceID;
