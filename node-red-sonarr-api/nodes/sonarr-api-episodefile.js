module.exports = function (RED) {
    'use strict';
    const { promisify } = require('util');

    function SonarrApiEpisodeFileGetNode(config) {
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
        } else if (!config.series_id) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid series id' });
            node.error('Error: Series Id configured incorrectly.');
        } else {
            this.server = RED.nodes.getNode(config.server);

            node.on('input', async function (msg) {
                node.status({ fill: 'blue', shape: 'dot', text: 'obtaining episode file/s' });
                let server = this.server;
                let nodeType = 'sonarr-api-episodefile-get';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    const evaluateNodeProperty = promisify(RED.util.evaluateNodeProperty);
                    let series_id = await evaluateNodeProperty(config.series_id, config.series_id_type || 'num', node, msg);
                    let uri = `episodefile`;
                    let opts = { seriesId: series_id };

                    server
                        .get(uri, opts)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Episode File/s returned`;
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
                                    message = `404 Not Found. Episode File/s with Series Id '${series_id}' not found.`;
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
                            statusMessage = "can't get episode file/s";

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

    RED.nodes.registerType('sonarr-api-episodefile-get', SonarrApiEpisodeFileGetNode);
};
