const client = require('prom-client');
const { mapObject } = require('./util');

class Metrics {
	constructor(config) {
		// client.collectDefaultMetrics({prefix: 'neohub-monitor-'});
		if(config.emitProcessMetrics === 'true') {
			client.collectDefaultMetrics();
		}
		this.gauges = new Map();
		this.defaultLabels = {};
	}

	addGauge(name, help, labelNames) {
		if(!this.gauges.has(name)) {
			const gauge = new client.Gauge({name, help, labelNames});
			this.gauges.set(name, gauge);
		}
	}

	removeGauge(name) {
		this.gauges.clear(name);
	}

	setGauge(name, value, labels) {
		const gauge = this.gauges.get(name);
		if(!gauge) {
			throw new Error(`unable to get gauge: ${gauge}`);
		}
		gauge.set(Object.assign(mapObject(labels, Metrics.escapeLabelValue), this.defaultLabels), value);
	}

	static escapeLabelValue(value) {
		return value.replace(' ', '_');
	}

	static getContentType() {
		return client.register.contentType;
	}

	static async getMetrics() {
		return await client.register.metrics();
	}
}

exports.Metrics = Metrics;
