const dotenv = require('dotenv');
const events = require('events');
const express = require('express');
const pino = require('pino');
const expressPino = require('express-pino-logger');

const { Logger } = require('./log');
const { NeoClient } = require('./client');
const { Metrics } = require('./metrics');

class NeoHubServer extends events.EventEmitter {

	constructor(config) {
		super();
		this.log = Logger.get().withType(this);
		config = this.config = config || dotenv.config().parsed;
		const metrics = this.metrics = new Metrics(config);
		this.client = new NeoClient(config, metrics);

		this.initServer();
	}

	initServer() {
		const expressLogger = expressPino(Logger.get().pino);
		const app = this.app = express();
		app.use(express.json(), expressLogger);
 
		app.get('/health', (req, res) => {
			this.log.trace('/health');
		    logger.debug('Calling res.send');
		    return res.status(200).send({message: 'ok'});
		});

		app.get('/metrics', async (req, res) => {
		try {
			this.log.trace('/metrics');
			res.set('Content-Type', Metrics.getContentType());
			res.end(await Metrics.getMetrics());
		} catch (err) {
			this.log.error('Unable to get metrics', {err});
			res.status(500).end(ex);
		}
		});
	}

	async startServer() {
		return new Promise((resolve, reject) => {
			const port = parseInt(this.config.metricsPort);
			this.server = this.app.listen(port, () => {
			    this.log.info(`Listening for requests on port ${port}`);
			    resolve();
			});
		});
	}

	stopServer() {
		if(this.server) {
			this.server.close();
		}
	}

	async start() {
		this.log.info('start');
		await this.startServer();
		await this.client.start();
		this.client.startPoll();
	}

	async stop() {
		this.log.info('stop');
		this.client.stopPoll();
		await this.client.stop();
		this.stopServer();
	}
}

exports.NeoHubServer = NeoHubServer;
