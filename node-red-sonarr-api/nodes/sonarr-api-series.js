module.exports = function (RED) {
    'use strict';

    function SonarrApiSeriesGetNode(config) {
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
                let server = this.server;
                let nodeType = 'sonarr-api-series-get';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let series_id = RED.util.evaluateNodeProperty(config.series_id, config.series_id_type || 'num', node, msg);
                    let uri = `series/${series_id ? series_id : ''}`;

                    server
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
                                    message = "404 Not Found. Series with Id '${series_id}' not found.`";
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
                            statusMessage = "can't get series";

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

    RED.nodes.registerType('sonarr-api-series-get', SonarrApiSeriesGetNode);
};
