module.exports = function (RED) {
    'use strict';

    function SonarrApiSeriesEditorPutNode(config) {
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
                node.status({ fill: 'blue', shape: 'dot', text: 'editing series' });
                let server = this.server;
                let nodeType = 'sonarr-api-serieseditor-put';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let series_ids = RED.util.evaluateNodeProperty(config.series_ids, config.series_ids_type || 'num', node, msg);
                    if (!series_ids) {
                        level = 'Error';
                        message = 'Series Id/s parameter is required';
                        statusMessage = "can't edit series";

                        server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                    } else {
                        let data = { seriesIds: Array.isArray(series_ids) ? series_ids : [series_ids] };
                        if (!data.seriesIds.every((element) => typeof element === 'number')) {
                            level = 'Error';
                            message = 'Not all elements of Series Id/s are numbers';
                            statusMessage = "can't edit series";

                            server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                        } else {
                            let uri = 'series/editor';
                            if (config.monitored) {
                                if (config.monitored == true || config.monitored == 'true') {
                                    data.monitored = true;
                                } else if (config.monitored == false || config.monitored == 'false') {
                                    data.monitored = false;
                                }
                            }
                            if (config.quality_profile) {
                                data.qualityProfileId = config.quality_profile;
                            }
                            if (config.language_profile) {
                                data.languageProfileId = config.language_profile;
                            }
                            if (config.root_folder) {
                                data.rootFolderPath = config.root_folder;
                                let move_files = RED.util.evaluateNodeProperty(config.move_files, 'bool', node, msg);
                                data.moveFiles = move_files;
                            }
                            if (config.series_type) {
                                data.seriesType = config.series_type;
                            }
                            if (config.season_folder) {
                                if (config.season_folder == true || config.season_folder == 'true') {
                                    data.seasonFolder = true;
                                } else if (config.season_folder == false || config.season_folder == 'false') {
                                    data.seasonFolder = false;
                                }
                            }
                            if (config.apply_tags) {
                                data.applyTags = config.apply_tags;
                                let tags = config.tags
                                    .toString()
                                    .split(',')
                                    .map((tag) => Number(tag));
                                if (!tags.every((element) => typeof element === 'number')) {
                                    level = 'Error';
                                    message = 'Not all elements of Tags are numbers';
                                    statusMessage = "can't edit series";

                                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                                    return;
                                } else {
                                    data.tags = tags;
                                }
                            }

                            server
                                .put(uri, null, data, null)
                                .then(function (response) {
                                    switch (response.status) {
                                        case 202:
                                            msg.payload = response.body;
                                            level = 'Info';
                                            message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Series edited`;
                                            statusMessage = message.toLowerCase();
                                            break;
                                        case 400:
                                            level = 'Error';
                                            message = '400 Bad Request. Check Series Editor parameters.';
                                            statusMessage = '400 bad request';
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
                                    statusMessage = "can't edit series";

                                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                                });
                        }
                    }
                } catch (err) {
                    level = 'Critical';
                    message = err;
                    statusMessage = 'unknown exception';

                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                }
            });
        }
    }

    RED.nodes.registerType('sonarr-api-serieseditor-put', SonarrApiSeriesEditorPutNode);
};
