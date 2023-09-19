module.exports = function(RED) {
    'use strict';

    function RadarrApiCalendarNode(config) {
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

            node.on('input', function(msg) {
                node.status({ fill: 'blue', shape: 'dot', text: 'Fetching schedule...' });
                let server = this.server;
                let nodeType = 'radarr-api-calendar';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let start = RED.util.evaluateNodeProperty(config.start, config.start_type || 'str', node, msg);
                    let end = RED.util.evaluateNodeProperty(config.end, config.end_type || 'str', node, msg);
                    let tags = RED.util.evaluateNodeProperty(config.tags, config.tags_type || 'str', node, msg);
                    let unmonitored = RED.util.evaluateNodeProperty(config.unmonitored, config.unmonitored_type || 'option', node, msg);
                    let url = new URLSearchParams();
                    if (start) {
                        url.append('start', start);
                    }
                    if (end) {
                        url.append('end', end);
                    }
                    url.append('unmonitored', unmonitored);
                    url.append('tags', tags);

                    let uri = `calendar?${url.toString()}`;

                    server
                        .get(uri)
                        .then(function(response) {
                            msg.url = uri;
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} items returned`;
                                    statusMessage = `${Array.isArray(msg.payload) ? msg.payload.length : 1} items returned`;
                                    break;
                                case 400:
                                    level = 'Error';
                                    message = '400 Bad Request. Check parameters.';
                                    statusMessage = '400 bad request';
                                    break;
                                case 401:
                                    level = 'Error';
                                    message = '401 Unauthorized. Invalid API Key.';
                                    statusMessage = '401 unauthorized';
                                    break;
                                case 404:
                                    level = 'Error';
                                    message = `404 Not Found. Parameters '${uri}' not found.`;
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
                        .catch(function(err) {
                            level = 'Error';
                            message = err;
                            statusMessage = 'can\'t get calendar';

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

    RED.nodes.registerType('radarr-api-calendar', RadarrApiCalendarNode);
};
