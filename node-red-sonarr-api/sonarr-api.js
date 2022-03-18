module.exports = function (RED) {
    'use strict';
    let request = require('request');

    function SonarrApiServerNode(config) {
        RED.nodes.createNode(this, config);

        if (this.credentials.url && this.credentials.api_key) {
            let errorMessage;
            this.get('system/status')
                .then(function (response) {
                    switch (response.status) {
                        case 200:
                            break;
                        case 401:
                            errorMessage = 'Error 401: Unauthorized. Invalid API Key.';
                            break;
                        default:
                            errorMessage = response;
                            break;
                    }
                })
                .catch(function (err) {
                    errorMessage = err;
                });

            if (errorMessage) {
                this.error(errorMessage);
            }
        }
    }
    RED.nodes.registerType('sonarr-api-server', SonarrApiServerNode, {
        credentials: {
            url: { type: 'text' },
            api_key: { type: 'password' },
        },
    });
    SonarrApiServerNode.prototype.get = function (uri, opts) {
        let node = this;
        opts = opts || {};
        opts.apikey = node.credentials.api_key;
        return new Promise(function (resolve, reject) {
            request.get(
                {
                    baseUrl: node.credentials.url,
                    uri: '/api/v3/' + uri,
                    json: true,
                    qs: opts,
                },
                function (err, response, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            status: response.statusCode,
                            body: body,
                        });
                    }
                }
            );
        });
    };

    function SonarrApiGetSeriesNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.status({});

        let credentials = RED.nodes.getCredentials(config.server);
        if (!credentials) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: No credentials configured.');
        } else if (!credentials.url || !credentials.api_key) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: Credentials configured incorrectly.');
        } else {
            this.server = RED.nodes.getNode(config.server);

            node.on('input', function (msg) {
                node.status({ fill: 'blue', shape: 'dot', text: 'obtaining series' });
                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let series_id = RED.util.evaluateNodeProperty(config.series_id, config.series_id_type || 'num', node, msg);
                    let uri = `series/${series_id ? series_id : ''}`;
                    let nodeType = 'sonarr-api-get-series';

                    this.server
                        .get(uri)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Series returned`;
                                    statusMessage = message.toLowerCase();
                                    break;
                                case 400:
                                    level = 'Error';
                                    message = '400 Bad Request. Check Series Id parameter.';
                                    statusMessage = '400 bad request';
                                    break;
                                case 401:
                                    level = 'Error';
                                    message = '401 Unauthorized. Invalid API Key.';
                                    statusMessage = '401 unauthorized';
                                    break;
                                case 404:
                                    level = 'Error';
                                    message = "404 Series with Id '${series_id}' not found.`";
                                    statusMessage = '404 not found';
                                    break;
                                default:
                                    level = 'Error';
                                    message = response;
                                    statusMessage = 'unknown error';
                                    break;
                            }

                            sendOutput(node, msg, nodeType, level, message, statusMessage);
                        })
                        .catch(function (err) {
                            level = 'Error';
                            message = err;
                            statusMessage = "can't get series";

                            sendOutput(node, msg, nodeType, level, message, statusMessage);
                        });
                } catch (err) {
                    level = 'Critical';
                    message = err;
                    statusMessage = 'unknown exception';

                    sendOutput(node, msg, nodeType, level, message, statusMessage);
                }
            });
        }
    }
    RED.nodes.registerType('sonarr-api-get-series', SonarrApiGetSeriesNode);

    function SonarrApiGetCommandNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.status({});

        let credentials = RED.nodes.getCredentials(config.server);
        if (!credentials) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: No credentials configured.');
        } else if (!credentials.url || !credentials.api_key) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: Credentials configured incorrectly.');
        } else {
            this.server = RED.nodes.getNode(config.server);

            node.on('input', function (msg) {
                node.status({ fill: 'blue', shape: 'dot', text: 'obtaining command/s' });
                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let command_id = RED.util.evaluateNodeProperty(config.command_id, config.command_id_type || 'num', node, msg);
                    let uri = `command/${command_id ? command_id : ''}`;
                    let nodeType = 'sonarr-api-get-command';

                    this.server
                        .get(uri)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Command/s returned`;
                                    statusMessage = message.toLowerCase();
                                    break;
                                case 400:
                                    level = 'Error';
                                    message = '400 Bad Request. Check Command Id parameter.';
                                    statusMessage = '400 bad request';
                                    break;
                                case 401:
                                    level = 'Error';
                                    message = '401 Unauthorized. Invalid API Key.';
                                    statusMessage = '401 unauthorized';
                                    break;
                                case 404:
                                    level = 'Error';
                                    message = "404 Command with Id '${command_id}' not found.`";
                                    statusMessage = '404 not found';
                                    break;
                                default:
                                    level = 'Error';
                                    message = response;
                                    statusMessage = 'unknown error';
                                    break;
                            }

                            sendOutput(node, msg, nodeType, level, message, statusMessage);
                        })
                        .catch(function (err) {
                            level = 'Error';
                            message = err;
                            statusMessage = "can't get command/s";

                            sendOutput(node, msg, nodeType, level, message, statusMessage);
                        });
                } catch (err) {
                    level = 'Critical';
                    message = err;
                    statusMessage = 'unknown exception';

                    sendOutput(node, msg, nodeType, level, message, statusMessage);
                }
            });
        }
    }
    RED.nodes.registerType('sonarr-api-get-command', SonarrApiGetCommandNode);

    function sendOutput(node, msg, sourceType, level, message, statusMessage) {
        let log = {
            payload: {
                source: {
                    id: node.id,
                    type: sourceType,
                    name: node.name,
                    topic: msg.topic,
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
    }
};
