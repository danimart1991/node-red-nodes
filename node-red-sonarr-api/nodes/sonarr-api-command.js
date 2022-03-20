module.exports = function (RED) {
    'use strict';

    function SonarrApiCommandGetNode(config) {
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
                let server = this.server;
                let nodeType = 'sonarr-api-command-get';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let command_id = RED.util.evaluateNodeProperty(config.command_id, config.command_id_type || 'num', node, msg);
                    let uri = `command/${command_id ? command_id : ''}`;

                    server
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
                                    message = "404 Not Found. Command with Id '${command_id}' not found.`";
                                    statusMessage = '404 not found';
                                    break;
                                default:
                                    level = 'Error';
                                    message = response;
                                    statusMessage = 'unknown error';
                                    break;
                            }

                            server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                        })
                        .catch(function (err) {
                            level = 'Error';
                            message = err;
                            statusMessage = "can't get command/s";

                            server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                        });
                } catch (err) {
                    level = 'Critical';
                    message = err;
                    statusMessage = 'unknown exception';

                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                }
            });
        }
    }

    RED.nodes.registerType('sonarr-api-command-get', SonarrApiCommandGetNode);
};
