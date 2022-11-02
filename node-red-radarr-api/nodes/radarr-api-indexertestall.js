module.exports = function (RED) {
    'use strict';

    function RadarrApiIndexerTestAllPostNode(config) {
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
                node.status({ fill: 'blue', shape: 'dot', text: 'testing indexers' });
                let server = this.server;
                let nodeType = 'radarr-api-indexertestall-post';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let uri = 'indexer/testall';

                    server
                        .post(uri)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Indexers Status returned`;
                                    statusMessage = message.toLowerCase();
                                    break;
                                case 401:
                                    level = 'Error';
                                    message = '401 Unauthorized. Invalid API Key.';
                                    statusMessage = '401 unauthorized';
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
                            statusMessage = "can't test indexers status";

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

    RED.nodes.registerType('radarr-api-indexertestall-post', RadarrApiIndexerTestAllPostNode);
};
