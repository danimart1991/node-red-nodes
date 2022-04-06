# @danimart1991/node-red-docker

[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)
![License](https://img.shields.io/github/license/danimart1991/node-red-nodes.svg)
[![NPM](https://img.shields.io/npm/v/@danimart1991/node-red-docker?logo=npm)](https://www.npmjs.org/package/@danimart1991/node-red-docker)
[![Known Vulnerabilities](https://snyk.io/test/npm/@danimart1991/node-red-docker/badge.svg)](https://snyk.io/test/npm/@danimart1991/node-red-docker)
[![Total Downloads](https://img.shields.io/npm/dt/@danimart1991/node-red-docker.svg)](https://www.npmjs.com/package/@danimart1991/node-red-docker)
![GitHub last commit](https://img.shields.io/github/last-commit/danimart1991/node-red-nodes.svg)
[![Tip Me via PayPal](https://img.shields.io/badge/PayPal-tip%20me-blue.svg?logo=paypal&style=flat)](https://www.paypal.me/danimart1991)
[![Sponsor Me via GitHub](https://img.shields.io/badge/GitHub-sponsor%20me-blue.svg?logo=github&style=flat)](https://github.com/sponsors/danimart1991)

A set of [_Node-RED_](http://nodered.org/) nodes to use with a [_Docker Server_](https://www.docker.com/).

## Install

As other custom nodes, the recommendation is to install using [the "_Manage Palettes_" option in _Node-RED_](https://nodered.org/docs/user-guide/runtime/adding-nodes).

Indeed, these nodes are available as individual _npm_ package. This repository acts as an overall store for the nodes - and is not intended as a way to install them - unless you really do want some development.

```bash
$ npm install @danimart1991/node-red-docker
```

## Usage

All the nodes have a **Server** parameter that must be configured to work (see **Config** below).

### Config

A **configuration** node that holds the credentials of a _Docker Server_. All the nodes need this node to work.

Two configuration options are valid to correctly configure this node:

- **URL+Port**: It's the server's URL used to connect to _Docker Server_, including _http(s)://_, _port_, and _urlbase_ if required.
- **Socket Path**: The _Socket Path_ used to connect to the _Docker Server_.

### Nodes

- **Containers**: Brings different options to work with the _Docker Containers_ in the server like `List`, `Inspect`, `Start`, `Stop`,...

### Log

In addition, all the nodes have a **Log** output that offers information on how the execution has worked.

```jsonc
{
    "payload": {
        "source": {
            "id": "0f12103e2251c436",
            "type": "docker-movie-get"
        },
        "level": "Info",
        "message": "2084 Movie/s returned"
    },
    "_msgid": "4c1261a1eb9bfb44"
}
```

| Property              | Type     | Description                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------------- |
| `payload.level`       | _string_ | The log **Level**: _Debug_, _Info_, _Warn_, _Error_, _Critical_ or _Other_. |
| `payload.message`     | _string_ | The log **Message**.                                                        |
| `payload.source.id`   | _string_ | The **Id** of the node that threw the log.                                  |
| `payload.source.type` | _string_ | The **Type** of the node that threw the log.                                |
| `payload.source.name` | _string_ | The **Name**, if set, of the node that threw the log.                       |

## Author

[Daniel Martin Gonzalez](https://danielmartingonzalez.com)

## License

[Apache 2.0](LICENSE)
