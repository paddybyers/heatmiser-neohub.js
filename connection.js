const dgram = require('dgram');
const events = require('events');
const hexy = require('hexy');
const net = require('net');
const { Logger } = require('./log');

const connectTimeout =15000;
const discoverInterval = 5000;
const recvTimeout = 30000;

class NeoDiscovery extends events.EventEmitter {
	constructor(config) {
		super();
		this.log = Logger.get().withType(this);
		this.log.debug('init');
		this.config = config;
	}

	async discover() {
		return new Promise((resolve) => {
			const seekMessage = Buffer.from('hubseek', 'utf8');
			const { discoverPort, localDiscoverPort } = this.config;
			this.socket = dgram.createSocket('udp4');
			this.socket.on('error', (err) => {
				this.log.error('socket error', {err});
				this.emit('error', err);
			});

			this.socket.bind(localDiscoverPort);
			this.socket.on('listening', () => {
				this.log.debug('listening');
				this.socket.setBroadcast(true);
				this.interval = setInterval(() => {
					this.socket.send(seekMessage, 0, seekMessage.length, discoverPort, '255.255.255.255');
				}, discoverInterval);

			});
			this.socket.on('message', (buf, remote) => {
				const message = buf.toString();
				this.log.debug('message', {remote: remote.address + ':' + remote.port, message});
				if(message == 'hubseek') {
					/* special-case common error case; someone else is also discovering */
					return;
				}
				try {
					const responseMessage = JSON.parse(message.toString());
					if(responseMessage.ip && responseMessage.device_id) {
						this.log.info('discovered', {responseMessage});
						this.emit('discovered', responseMessage);
						resolve(responseMessage);
					}
				} catch(err) {
					this.log.warn('exception processing message', {err});
				}
			});
		});
	}

	async dispose() {
		this.log.debug('dispose');
		return new Promise((resolve) => {
			if(this.interval) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			this.socket.close((err) => {
				if(err) {
					this.log.error('dispose exception', {err});
				}
				this.socket.removeAllListeners();		
				resolve();	
			});
		});
	}

	inspect() {
		return {
		};
	}
}

class NeoConnection extends events.EventEmitter {
	constructor(address, config) {
		super();
		this.log = Logger.get().withType(this).with({address});
		this.log.info('init');
		this.config = config;
		this.address = address;
		this.connected = false;
	}

	async connect() {
		this.log.debug('connect');
		const { protocolPort } = this.config;
		this.log.debug('port', {protocolPort});

		return new Promise((resolve, reject) => {

			let timer;
			let pending = true;

			this.emit('connecting');
			try {
				this.socket = net.createConnection({
					host: this.address,
					port: protocolPort,
					noDelay: true,
					keepAlive: true
				});
				this.socket.on('connect', () => {
					this.log.debug('on connect');
					clearTimeout(timer);
					this.emit('connect');
					this.onConnected();
					pending = false;
					resolve();
				});
				this.socket.on('data', (data) => {
					this.log.debug('on data');
					this.log.trace(hexy.hexy(Buffer.from(data)));

				});
				this.socket.on('error', (err) => {
					this.log.error('on error', {err});
					clearTimeout(timer);
					this.onConnectionFailed(err);
					if(pending) {
						pending = false;
						reject(err);
					}
				});

				timer = setTimeout(() => {
					this.log.error('socket connect timeout');
					const err = new Error('timeout');
					this.onConnectionFailed(err);
					if(pending) {
						pending = false;
						reject(err);
					}
				}, connectTimeout);
			} catch(err) {
				this.log.error('socket connect error', {err});
				this.onConnectionFailed(err);
				if(pending) {
					pending = false;
					reject(err);
				}
			}
		});
	}

	onConnected() {
		this.log.debug('onConnected');
		this.emit('connect');
		this.socket.setEncoding('utf8');
		this.connected = true;
		this.emit('connected');
		this.socket.on('close', () => {
			this.log.debug('close');
			this.emit('disconnected');
			this.onConnectionFailed();
		});
	}

	onConnectionFailed(err) {
		this.log.debug('onConnectionFailed', {err});
		if(this.socket) {
			this.connected = false;
			this.socket.destroy();
			this.socket = undefined;
		}
		this.emit('failed', err);
	}

	async send(message) {
		this.log.debug('send', {message});
		return new Promise((resolve, reject) => {
			this.socket.write(message, 'utf8', (err) => {
				err ? reject(err) : resolve();
			});
		});
	}

	async recv(validator) {
		this.log.debug('recv');
		return new Promise((resolve, reject) => {
			var data = '';
			var chunkHandler;
			const socket = this.socket;
			const timer = setTimeout(() => {
				socket.removeListener('data', chunkHandler);
				reject('Timeout');
			}, recvTimeout);
			chunkHandler = (chunk) => {
				this.log.trace('recv: chunk', {chunk});
				data = data + chunk;
				try {
					const validResponse = validator(data);
					if(validResponse !== undefined) {
						this.log.trace('recv: valid', {validResponse});
						socket.removeListener('data', chunkHandler);
						clearTimeout(timer);
						resolve(validResponse);
					}
				} catch(err) {
					/* unrecoverable error with data accumulated so far */
					this.log.error('recv: exception', {err});
					socket.removeListener('data', chunkHandler);
					clearTimeout(timer);
					reject(err);
				}
			};
			socket.on('data', chunkHandler);
		});
	}

	async dispose() {
		this.log.debug('dispose');
		return new Promise((resolve) => {
			if(!this.socket) {
				resolve();
				return;
			}
			this.socket.end((err) => {
				if(err) {
					this.log.error('dispose exception', {err});
				}
				this.socket.destroy();
				this.socket.removeAllListeners();
				resolve();
			});
		});
	}

	inspect() {
		return {
			connected: this.connected
		};
	}
}

class NeoHubID {
	constructor(address, deviceId) {
		this.address = address;
		this.deviceId = deviceId;
	}

	inspect() {
		return {
			address: this.address,
			deviceId: this.deviceId
		}
	}
}

exports.NeoConnection = NeoConnection;
exports.NeoDiscovery = NeoDiscovery;
exports.NeoHubID = NeoHubID;
