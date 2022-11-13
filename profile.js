class ComfortLevel {
	constructor() {
		this.time = undefined;
		this.temp1 = undefined;
		this.temp2 = undefined;
		this.enableTemp2 = undefined;
	}

	toJSON() {
		return [this.time, this.temp1, this.temp2, this.enableTemp2];
	}

	static fromJSON(resp) {
		const res = new ComfortLevel();
		res.time = resp[0];
		res.temp1 = resp[1];
		res.temp2 = resp[2];
		res.enableTemp2 = resp[3];
		return res;
	}

	synopsis() {
		return [this.time, this.temp1];
	}
}

class ComfortLevelSpec {
	static fromJSON(resp) {
		if(resp.leave) {
			return Comfort4LevelSpec.fromJSON(resp);
		} else {
			return Comfort6LevelSpec.fromJSON(resp);
		}
	}
}

class Comfort4LevelSpec {
	constructor() {
		this.wake = undefined;
		this.leave = undefined;
		this.return = undefined;
		this.sleep = undefined;
	}

	toJSON() {
		return {
			wake: this.wake.toJSON(),
			leave: this.leave.toJSON(),
			return: this.return.toJSON(),
			sleep: this.sleep.toJSON(),
		};
	}

	static fromJSON(resp) {
		const res = new Comfort4LevelSpec();
		for(const item of Object.keys(res)) {
			if(resp[item] !== undefined) {
				res[item] = ComfortLevel.fromJSON(resp[item]);
			}
		}
		return res;
	}

	synopsis() {
		return {
			wake: this.wake.synopsis(),
			leave: this.leave.synopsis(),
			return: this.return.synopsis(),
			sleep: this.sleep.synopsis(),
		};
	}
}

class Comfort6LevelSpec {
	constructor() {
		this.level1 = undefined;
		this.level2 = undefined;
		this.level3 = undefined;
		this.level4 = undefined;
		this.wake = undefined;
		this.sleep = undefined;
	}

	toJSON() {
		return {
			level1: this.level1.toJSON(),
			level2: this.level2.toJSON(),
			level3: this.level3.toJSON(),
			level4: this.level4.toJSON(),
			wake: this.wake.toJSON(),
			sleep: this.sleep.toJSON(),
		};
	}

	static fromJSON(resp) {
		const res = new Comfort6LevelSpec();
		for(const item of Object.keys(res)) {
			if(resp[item] !== undefined) {
				res[item] = ComfortLevel.fromJSON(resp[item]);
			}
		}
		return res;
	}

	synopsis() {
		return {
			level1: this.level1.synopsis(),
			level2: this.level2.synopsis(),
			level3: this.level3.synopsis(),
			level4: this.level4.synopsis(),
			wake: this.wake.synopsis(),
			sleep: this.sleep.synopsis(),
		};
	}
}

const ProfileType_24h = '24h';
const ProfileType_5_2d = '5/2day';
const ProfileType_7d = '7day';

class Profile {
	constructor() {
		this.type = undefined;
		this.sunday = undefined;
		this.monday = undefined;
		this.tuesday = undefined;
		this.wednesday = undefined;
		this.thursday = undefined;
		this.friday = undefined;
		this.saturday = undefined;
	}

	toJSON() {
		switch(this.type) {
			case ProfileType_24h:
				return {sunday: this.sunday.toJSON()};
			case ProfileType_5_2d:
				return {
					sunday: this.sunday.toJSON(),
					monday: this.monday.toJSON()
				};
			case ProfileType_7d:
				return {
					sunday: this.sunday.toJSON(),
					monday: this.monday.toJSON(),
					tuesday: this.tuesday.toJSON(),
					wednesday: this.wednesday.toJSON(),
					thursday: this.thursday.toJSON(),
					friday: this.friday.toJSON(),
					saturday: this.saturday.toJSON()
				};
			default:
				return this;
		}
	}

	static fromJSON(resp) {
		console.log('Profile.fromJSON()', resp);
		const res = new Profile();
		for(const day of Object.keys(resp)) {
			res[day] = ComfortLevelSpec.fromJSON(resp[day]);
		}
		if(res.tuesday) {
			res.type = ProfileType_7d
		} else if(res.monday) {
			res.type = ProfileType_5_2d;
		} else {
			res.type = ProfileType_24h;
		}
		return res;
	}

	inspect() {
		switch(this.type) {
			case ProfileType_24h:
				return {sunday: this.sunday.synopsis()};
			case ProfileType_5_2d:
				return {
					sunday: this.sunday.synopsis(),
					monday: this.monday.synopsis()
				};
			case ProfileType_7d:
				return {
					sunday: this.sunday.synopsis(),
					monday: this.monday.synopsis(),
					tuesday: this.tuesday.synopsis(),
					wednesday: this.wednesday.synopsis(),
					thursday: this.thursday.synopsis(),
					friday: this.friday.synopsis(),
					saturday: this.saturday.synopsis()
				};
			default:
				return this;
		}
	}
}

class DeviceProfile {
	constructor() {
		this.deviceName = undefined;
		this.timestamp = undefined;
		this.profile = undefined;
	}

	toJSON() {
		const profileJSON = this.profile.toJSON();
		profileJSON.device = this.deviceName;
		return {
			TIMESTAMP: this.timestamp,
			profiles: [profileJSON.toJSON()]
		};
	}

	static fromJSON(resp) {
		console.log('DeviceProfile.fromJSON()', resp);
		const res = new DeviceProfile();
		res.timestamp = resp.TIMESTAMP;
		const profile = resp.profiles[0];
		res.deviceName = profile.device;
		res.profile = Profile.fromJSON(profile);
		return res;
	}

	synopsis() {
		return this.profile.synopsis();
	}

	inspect() {
		return this.profile.inspect();
	}
}

class NamedProfile {
	constructor() {
		this.profileId = undefined;
		this.info = undefined;
		this.name = undefined;
		this.group = undefined;
	}

	static fromJSON(resp) {
		console.log('NamedProfile.fromJSON()', resp);
		const res = new NamedProfile();
		res.profileId = resp.PROFILE_ID;
		res.info = Profile.fromJSON(resp.info);
		res.name = resp.name;
		res.group = resp.group;
		return res;
	}

	synopsis() {
		return Object.assign({profileId: this.profileId}, this.info.synopsis());
	}

	inspect() {
		return Object.assign({profileId: this.profileId}, this.info.inspect());
	}
}

exports.ComfortLevel = ComfortLevel;
exports.Comfort4LevelSpec = Comfort4LevelSpec;
exports.Comfort6LevelSpec = Comfort6LevelSpec;
exports.Profile = Profile;
exports.DeviceProfile = DeviceProfile;
exports.NamedProfile = NamedProfile;
