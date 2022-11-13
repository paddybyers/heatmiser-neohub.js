#!/usr/bin/env node

const vorpal = require('vorpal');
const util = require('util');

const { NeoClient } = require('./client');

const cli = vorpal();
addCommands(cli);

if(process.argv.length > 2) {
	/* non-interactive */
	const args = process.argv.slice(2);
	const result = cli.exec(args.join(' '), (err, result) => {
		if(err) {
			console.error(result);
			process.exit(1);			
		}
		if(result) {
			console.error(result);
		}
		process.exit(!!result * 1);
	});
} else {
	/* interactive */
	cli.delimiter('neo-cli:')
		.show();
}

function addCommands(cli) {
	cli.command('hub show-saved')
		.action(async (args) => {
			const client = new NeoClient();
			const hubAddress = client.getPersistedAddress();
			if(hubAddress) {
				cli.activeCommand.log(console.table({hub:hubAddress}));
			} else {
				cli.activeCommand.log('No saved hub');
			}
		});

	cli.command('hub delete-saved')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				await client.deletePersistedAddress();
			} catch(err) {
				cli.activeCommand.log('Unable to delete saved hub');
			}
		});

	cli.command('hub discover')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				const hubAddress = await client.discoverHub();
				if(hubAddress) {
					cli.activeCommand.log(console.table({hub:hubAddress}));
				} else {
					cli.activeCommand.log('No known hub');
				}
			} catch(err) {
				cli.activeCommand.log('Unexpected error discovering hub', err);
			}
		});

	cli.command('hub status')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				const hub = await client.start();
				await client.stop();
				cli.activeCommand.log(console.table(hub.inspect()));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting hub status', err);
			}
		});

	cli.command('zone list')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				const hub = await client.start();
				await client.stop();
				const zones = {};
				for(const [zoneName, stat] of hub.zoneStats.entries()) {
					zones[zoneName] = stat.synopsis();
				}
				cli.activeCommand.log(console.table(zones));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting zones', err);
			}
		});

	cli.command('zone show <name>')
		.action(async (args) => {
			const client = new NeoClient();
			const zoneName = decodeURIComponent(args.name);
			try {
				const hub = await client.start();
				await client.stop();
				if(!hub.zoneStats.has(zoneName)) {
					cli.activeCommand.log('Unknown zone name', zoneName);
					return;
				}
				const stat = hub.zoneStats.get(zoneName);
				cli.activeCommand.log(console.table(stat.inspect()));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting zone details', err);
			}
		});

	cli.command('zone show-profile <name>')
		.action(async (args) => {
			const client = new NeoClient();
			const zoneName = decodeURIComponent(args.name);
			try {
				const hub = await client.start();
				await client.stop();
				if(!hub.zoneStats.has(zoneName)) {
					cli.activeCommand.log('Unknown zone name', zoneName);
					return;
				}
				const profile = hub.zoneStats.get(zoneName).profile0;
				cli.activeCommand.log(console.table(profile.inspect()));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting zone details', err);
			}
		});

	cli.command('device list')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				const hub = await client.start();
				await client.stop();
				const devices = {};
				for(const [deviceName, plug] of hub.plugs.entries()) {
					devices[deviceName] = plug.synopsis();
				}
				cli.activeCommand.log(console.table(devices));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting hub devices', err);
			}
		});

	cli.command('device show <name>')
		.action(async (args) => {
			const client = new NeoClient();
			const deviceName = decodeURIComponent(args.name);
			try {
				const hub = await client.start();
				await client.stop();
				if(!hub.plugs.has(deviceName)) {
					cli.activeCommand.log('Unknown device name', deviceName);
					return;
				}
				const plug = hub.plugs.get(deviceName);
				cli.activeCommand.log(console.table(plug.inspect()));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting device details', err);
			}
		});

	cli.command('profile list')
		.action(async (args) => {
			const client = new NeoClient();
			try {
				const hub = await client.start();
				await client.stop();
				const profiles = {};
				for(const [profileName, profile] of hub.definedProfiles.entries()) {
					profiles[profileName] = profile.synopsis();
				}
				cli.activeCommand.log(console.table(profiles));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting profiles', err);
			}
		});

	cli.command('profile show <name>')
		.action(async (args) => {
			const client = new NeoClient();
			const profileName = decodeURIComponent(args.name);
			try {
				const hub = await client.start();
				await client.stop();
				if(!hub.definedProfiles.has(profileName)) {
					cli.activeCommand.log('Unknown profile name', profileName);
					return;
				}
				const profile = hub.definedProfiles.get(profileName);
				cli.activeCommand.log(console.table(profile.inspect()));
			} catch(err) {
				cli.activeCommand.log('Unexpected error getting profile details', err);
			}
		});

}
