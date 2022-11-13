const events = require('events');
const hexy = require('hexy');

const { Logger } = require('./log');

const heartbeatInterval = 30000;
const delimiter = '\0\n';

function delimitedJSON(text) {
	const log = Logger.get().with({action: delimitedJSON});
	log.trace();
	if(!text.includes('\0')) {
		log.trace('no nulls');
		return undefined;
	}
	text = text.replaceAll('\0', '').trim();
	log.trace('attempting parse');
	return JSON.parse(text);
}

class NeoProtocol extends events.EventEmitter {
	constructor(connection) {
		super();
		this.log = connection.log.withType(this);
		this.log.debug('init');
		this.connection = connection;
		this.heartbeatTimer = undefined;
		this.inProgressCommand = undefined;
		this.startHeartbeat();
	}

	startHeartbeat() {
		this.log.debug('startHeartbeat');
		if(!this.heartbeatTimer) {
			this.log.debug('starting interval');
			this.heartbeatTimer = setInterval(this.heartbeat.bind(this), heartbeatInterval);
		}
	}

	stopHeartbeat() {
		this.log.debug('stopHeartbeat');
		if(this.heartbeatTimer) {
			this.log.debug('clearing interval');
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = undefined;
		}
	}

	heartbeat() {
		this.log.trace('heartbeat');
		this.sendCommand(new NeoCommand("GET_SYSTEM", []), (err, response) => {
			if(err) {
				this.log.error('error', {err});
				return;
			}
			this.log.debug('heartbeat response', {response});
			this.emit('heartbeat');
		});		
	}

	async sendCommand(cmd) {
		this.log.debug('sendCommand');
		this.log.trace('cmd', {cmd});
		if(!this.connection.connected) {
			this.log.warn('not connected');
			throw 'Not connected';
			return;
		}
		if(this.inProgressCommand) {
			this.log.warn('sendCommand: inprogress', {inProgressCommand: this.inProgressCommand});
			throw 'InProgress: ' + this.inProgressCommand;
			return;
		}
		this.inProgressCommand = cmd;
		this.connection.send(cmd.serialise());
		try {
			return await this.readResponse();
		} catch(err) {
			this.log.error('sendCommand: read error', {err});
			throw err;
		} finally {
			this.inProgressCommand = undefined;
			this.emit('commandComplete', cmd);
		}
	}

	async readResponse() {
		this.log.debug('readResponse');
		try {
			const response = await this.connection.recv(delimitedJSON);
			this.log.trace('readResponse', {response});
			return response;
		} catch(err) {
			this.log.error('readResponse: error', {err});
			throw err;
		}
	}

	async dispose() {
		return new Promise((resolve) => {
			this.stopHeartbeat();
			if(!this.inProgressCommand) {
				resolve();
				return;
			}
			this.once('commandComplete', () => {
				resolve();
			});
		});
	}

	inspect() {
		return {
			inProgressCommand: this.inProgressCommand
		};
	}
}

class NeoCommand {
	constructor(cmd, args) {
		this.cmd = cmd;
		this.args = args;
	}

	serialise() {
		const obj = {};
		obj[this.cmd] = (this.args && this.args.length) ? this.args : 0;
		return JSON.stringify(obj) + delimiter;
	}

	inspect() {
		return this;
	}
}

exports.NeoProtocol = NeoProtocol;
exports.NeoCommand = NeoCommand;
