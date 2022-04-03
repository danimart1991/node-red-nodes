module.exports = function (RED) {
    'use strict';
    let http = require('http');

    function DockerServerNode(config) {
        RED.nodes.createNode(this, config);
    }

    RED.nodes.registerType('docker-server', DockerServerNode, {
        credentials: {
            host_name: { type: 'text' },
            port: { type: 'text' },
            socket_path: { type: 'text' },
        },
    });

    DockerServerNode.prototype.request = function (path, method, options, data) {
        let node = this;
        options = options || {};
        options.path = path;
        options.method = method || 'GET';
        if (node.credentials) {
            if (node.credentials.socket_path) {
                options.socketPath = node.credentials.socket_path;
            } else if (node.credentials.host_name && node.credentials.port) {
                options.hostname = node.credentials.host_name;
                options.port = node.credentials.port;
            }
        }
        return new Promise(function (resolve, reject) {
            var request = http.request(options, (response) => {
                let body = '';
                response.on('data', (data) => (body = JSON.parse(data)));
                response.on('end', () => resolve({ status: response.statusCode, body: body }));
            });
            if (data) {
                request.write(data);
            }
            request.on('error', (err) => reject(err));
            request.end();
        });
    };

    DockerServerNode.prototype.sendOutput = function (node, msg, sourceType, level, message, statusMessage) {
        let log = {
            payload: {
                source: {
                    id: node.id,
                    type: sourceType,
                    name: node.name,
                    topic: msg ? msg.topic : '',
                },
                level: level,
                message: message,
            },
        };

        switch (level) {
            case 'Debug':
                node.send([msg ? msg : null, log]);
                node.trace(message);
                node.status({ fill: 'green', shape: 'dot', text: statusMessage });
                break;
            case 'Info':
                node.send([msg ? msg : null, log]);
                node.log(message);
                node.status({ fill: 'green', shape: 'dot', text: statusMessage });
                break;
            case 'Warn':
                node.send([msg ? msg : null, log]);
                node.warn(message);
                node.status({ fill: 'yellow', shape: 'dot', text: statusMessage });
                break;
            case 'Error':
            case 'Critical':
                node.send([null, log]);
                node.error(message, msg);
                node.status({ fill: 'red', shape: 'dot', text: statusMessage });
                break;
            default:
                node.send([null, log]);
                node.error(message, msg);
                node.status({ fill: 'grey', shape: 'dot', text: statusMessage });
                break;
        }

        return;
    };
};
