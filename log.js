const pino = require('pino');
const pretty = require('pino-pretty');
const baseLogger = pino({level: 'warn'}, pretty({
	colorize: true
}));
// const baseLogger = pino({level: 'info'});

class Logger {
	constructor(pino, ctx) {
		pino = pino || baseLogger;
		this.pino = ctx ? pino.child(ctx) : pino;
	}

	static get() {
		return new Logger();
	}

	getLevel() {
		return this.pino.level;
	}

	setLevel(level) {
		this.pino.level = level;
	}

	withType(obj) {
		return this.with({type: obj.constructor.name});
	}

	with(ctx) {
		return new Logger(this.pino, ctx);
	}
}

['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach((level) => {
	Logger.prototype[level] = function(a, b) {
		if(b === undefined) {
			return this.pino[level](a);
		} else {
			return this.pino[level](b, a);
		}
	};
});

exports.Logger = Logger;