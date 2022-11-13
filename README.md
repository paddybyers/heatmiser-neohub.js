# heatmiser-neohub.js

## Overview

This is an embryonic client library and CLI for the Heatmiser NeoHub v2. This work really is at a very early stage, so expect bugs. Issues and PRs are welcome.

At present this library is based on the legacy (TCP-based) protocol. I will extend it to support the websocket protocol as soon as support is added to the Android app to support key generation for API access. Therefore, in order to use this library, you must enable legacy API access for your hub via the app, and then establish a connection to ensure that the API remains accessible for a usable period of time.

## Connection and discovery

This library uses the UDP broadcast-based discovery mechanism, and therefore in order to run it you need to be on the same local network as the Hub.

The library will save discovered Hub details in `~/.neo`. Once discovered the Hub IP will remain cached until there is a failure to connect to that address, after which the cache is purged and re-discovery will take place.

## Installation

    npm install --save heatmiser-neohub.js

## CLI

The CLI currently supports read-only access to the hub, so the hub, devices/zones and profiles can be inspected. Modification of device/zone settings is also possible via the protocol, so update/delete operations may be added in the future. PRs are welcome.

The CLI is based on the [Vorpal.js](https://vorpal.js.org/) framework, so operates in two modes:

- a conventional CLI with arguments given on the command line. For example `./neo.js hub status` will show the status of the local hub;

- interactive mode, entered by launching the CLI with no arguments, via `./neo.js`. This enters an interactive command interpreter in which the various CLI commands can be entered directly, eg with `hub status`.

### Commands

#### `hub show-saved`

Displays the cached details of the currently known local hub, if any.

#### `hub delete-saved`

Deletes the cached details of the currently known local hub, if any.

#### `hub discover`

Initiates a discovery to find a local hub, replacing the cached hub details if there are any. Discovery uses the UDP broadcast-based mechanism.

#### `hub status`

Displays details of the hub on the current network if available.

#### `zone list`

Lists zones attached to the local hub.

#### `zone show <name>`

Displays details of the given zone.

#### `device list`

Lists non-zone devices (eg plugs) attached to the local hub.

#### `device show <name>`

Displays details of the given device.

#### `profile list`

Lists the saved profiles for the local hub.

#### `profile show <name>`

Displays details of the given saved profile.

## API

To discover, connect and interact with a hub, create an instance of `NeoClient`.

### Client

Create a new client with no arguments to use the default configuration

```
const { NeoClient } = require('heatmiser-neohub.js');

const client = new NeoClient();
```

A non-default configuration can be provided as an argument:

```
const client = new NeoClient({protocolPort:4246});
```

Default configuration values are set in `.env`.

Start monitoring the hub

```
const client = new NeoClient();
const hub = await client.start();
```

This will connect to the hub and continue to poll status every 10s.

Stop monitoring the hub

```
await client.stop();
```

### Hub

To interact with a hub once connection is established, methods may be invoked on the `NeoHub` instance returned from `start()`.

The `NeoHub` exposes a range of methods corresponding to the majority of commands supported in the protocol.

`NeoHub.updateNetwork()` performs a full sync of the client with the Hub, performing a `GET_LIVE_DATA` command and a sync of zones and other devices, and saved profiles.

## Limitations

Testing has been limited to a hub with connected wired zone stats. No real-world testing has taken place for timeclocks/plus or wireless stats.

Group operations are not supported.

Multiple hubs on the same network are not supported.

## Contributing

This is a work in progress and contributions, issues and PRs are welcome.


