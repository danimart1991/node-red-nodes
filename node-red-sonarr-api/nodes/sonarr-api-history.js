module.exports = function (RED) {
    'use strict';
    const { promisify } = require('util');

    function SonarrApiHistoryGetNode(config) {
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

            node.on('input', async function (msg) {
                node.status({ fill: 'blue', shape: 'dot', text: 'obtaining histories' });
                let server = this.server;
                let nodeType = 'sonarr-api-history-get';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    const evaluateNodeProperty = promisify(RED.util.evaluateNodeProperty);
                    let include_series = await evaluateNodeProperty(config.include_series, 'bool', node, msg);
                    let include_episode = await evaluateNodeProperty(config.include_episode, 'bool', node, msg);
                    let series_id = await evaluateNodeProperty(config.series_id, config.series_id_type || 'num', node, msg);
                    let episode_id = await evaluateNodeProperty(config.episode_id, config.episode_id_type || 'num', node, msg);
                    let page = await evaluateNodeProperty(config.page, config.page_type || 'num', node, msg);
                    let page_size = await evaluateNodeProperty(config.page_size, config.page_size_type || 'num', node, msg);
                    let uri = 'history';
                    let opts = {
                        includeSeries: include_series,
                        includeEpisode: include_episode,
                        seriesId: series_id,
                        episodeId: episode_id,
                        sortKey: config.sort_key,
                        sortDirection: config.sort_dir,
                    };
                    if (page) {
                        opts.page = page;
                    }
                    if (page_size) {
                        opts.pageSize = page_size;
                    }
                    if (config.event_type) {
                        opts.eventType = config.event_type;
                    }

                    server
                        .get(uri, opts)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = `${msg.payload && msg.payload.pageSize ? msg.payload.pageSize : '?'} histories returned`;
                                    statusMessage = message.toLowerCase();
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
                            statusMessage = "can't get histories";
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

    RED.nodes.registerType('sonarr-api-history-get', SonarrApiHistoryGetNode);
};
