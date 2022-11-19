const dotenv = require('dotenv');
const events = require('events');

const { NeoConnection, NeoDiscovery, NeoHubID } = require('./connection');
const { NeoProtocol } = require('./protocol');
const { NeoHub } = require('./hub');
const { NeoStat } = require('./stat');
const { Logger } = require('./log');
const { Properties } = require('./properties');

const discoveryInterval = 15000;
const connectRetryWait = 5000;
const pollInterval = 10000;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class NeoClient extends events.EventEmitter {

	constructor(config, metrics) {
		super();
		this.config = config || dotenv.config().parsed;
		this.log = Logger.get().withType(this);
		this.discoveredAddress = undefined;
		this.protocol = undefined;
		this.hub = undefined;
		this.pollTimer = undefined;
		this.metrics = metrics;
	}

	async start() {
		this.log.info('start');
		await this.connect();
		await this.updateNetwork();
		return this.hub;
	}

	async stop() {
		this.log.info('stop');
		await this.disconnect();
	}

	getPersistedAddress() {
		const hubAddress = Properties.get('address');
		if(!hubAddress) {
			return undefined;
		}
		return new NeoHubID(hubAddress, Properties.get('deviceId'));
	}

	async savePersistedAddress(hubID) {
		this.discoveredAddress = hubID;
		Properties.put('address', hubID.address);
		Properties.put('deviceId', hubID.deviceId);
		try {
			await Properties.save();
			this.emit('discoveredHub');
			return hubID;
		} catch(err) {
			this.log.error('error persisting discovered hub address', {err});
		}
	}

	async deletePersistedAddress() {
		this.discoveredAddress = undefined;
		Properties.put('address', '');
		Properties.put('deviceId', '');
		await Properties.save();
	}

	async discoverHub() {
		this.log.info('discover');
		const discover = new NeoDiscovery(this.config);
		try {
			const responseMessage = await discover.discover();
			this.log.info('discovered');
			await discover.dispose();
			const discoveredAddress = new NeoHubID(responseMessage.ip, responseMessage.device_id);
			await this.savePersistedAddress(discoveredAddress);
			return discoveredAddress;
		} catch(err) {
			this.log.error('error in discovery', {err});
			await discover.dispose();
			await timeout(discoverInterval);
			return discoverHub();
		}
	}

	async connect() {
		this.log.info('connect');
		/* if we already have a connection, do nothing */
		if(this.connection) {
			this.log.debug('connect: connection already exists');
			return;
		}

		/* try to get address from cache */
		if(!this.discoveredAddress) {
			this.discoveredAddress = this.getPersistedAddress();
		}

		if(!this.discoveredAddress) {
			/* wait until discovered */
			this.log.debug('connect: no discoveredAddress; discovering');
			try {
				await this.discoverHub();
			} catch(err) {
				this.log.error('unable to discover hub', {err});
				throw err;
			}
		}

		try {
			this.connection = new NeoConnection(this.discoveredAddress.address, this.config);
			await this.connection.connect();
			this.protocol = new NeoProtocol(this.connection);
			this.hub = new NeoHub(this.discoveredAddress, this.protocol, this.metrics);
			this.emit('connected');
		} catch(err) {
			this.log.warn('connection failed; clearing cached hub address', {err});
			this.disconnect();
			await this.deletePersistedAddress();
			await timeout(connectRetryWait);
			this.log.info('reconnecting');
			return this.connect();
		}
	}

	async disconnect() {
		this.log.info('disconnect');
		this.stopPoll();
		if(this.protocol) {
			await this.protocol.dispose();
			this.protocol = undefined;
		}
		if(this.connection) {
			await this.connection.dispose();
			this.connection = undefined;
		}
	}

	async updateNetwork() {
		this.log.info('updateNetwork');
		try {
			await this.hub.updateNetwork();
			this.log.debug('network discovered');
			this.emit('networkDiscovered');
		} catch(err) {
			this.log.error('updateNetwork: discovery error', {err});
			throw err;
		}
	}

	startPoll() {
		this.log.info('startPoll');
		if(!this.pollTimer) {
			this.log.debug('starting interval');
			this.pollTimer = setInterval(this.poll.bind(this), pollInterval);
		}
	}

	stopPoll() {
		this.log.info('stopPoll');
		if(this.pollTimer) {
			this.log.debug('clearing interval');
			clearInterval(this.pollTimer);
			this.pollTimer = undefined;
		}
	}

	async poll() {
		this.log.info('poll');
		try {
			await this.hub.updateNetwork();
		} catch(err) {
			this.log.error('poll error', {err});
		}
	}

	inspect() {
		return {
			discoveredAddress: this.discoveredAddress,
			connected: this.connected,
			hub: this.hub && this.hub.inspect(),
			connection: this.connection && this.connection.inspect(),
			protocol: this.protocol && this.protocol.inspect()
		}
	}
}

exports.NeoClient = NeoClient;
