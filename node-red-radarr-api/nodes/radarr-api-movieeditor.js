module.exports = function (RED) {
    'use strict';

    function RadarrApiMovieEditorPutNode(config) {
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
                node.status({ fill: 'blue', shape: 'dot', text: 'editing movie/s' });
                let server = this.server;
                let nodeType = 'radarr-api-movieeditor-put';

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                try {
                    let movie_ids = RED.util.evaluateNodeProperty(config.movie_ids, config.movie_ids_type || 'num', node, msg);
                    if (!movie_ids) {
                        level = 'Error';
                        message = 'Movie Id/s parameter is required';
                        statusMessage = "can't edit movie/s";

                        server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                    } else {
                        let data = { movieIds: Array.isArray(movie_ids) ? movie_ids : [movie_ids] };
                        if (!data.movieIds.every((element) => typeof element === 'number')) {
                            level = 'Error';
                            message = 'Not all elements of Movie Id/s are numbers';
                            statusMessage = "can't edit movie/s";

                            server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                        } else {
                            let uri = 'movie/editor';
                            if (config.monitored && config.monitored != -1) {
                                if (config.monitored == true || config.monitored == 'true') {
                                    data.monitored = true;
                                } else if (config.monitored == false || config.monitored == 'false') {
                                    data.monitored = false;
                                }
                            }
                            if (config.quality_profile && config.quality_profile != -1) {
                                data.qualityProfileId = config.quality_profile;
                            }
                            if (config.minimum_availability && config.minimum_availability != -1) {
                                data.minimumAvailability = config.minimum_availability;
                            }
                            if (config.apply_tags && config.apply_tags != -1) {
                                data.applyTags = config.apply_tags;
                                let tags = config.tags
                                    .toString()
                                    .split(',')
                                    .map((tag) => Number(tag));
                                if (!tags.every((element) => typeof element === 'number')) {
                                    level = 'Error';
                                    message = 'Not all elements of Tags are numbers';
                                    statusMessage = "can't edit movie/s";

                                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                                    return;
                                } else {
                                    data.tags = tags;
                                }
                            }

                            server
                                .put(uri, null, data, null)
                                .then(function (response) {
                                    msg.payload = response.body;
                                    switch (response.status) {
                                        case 202:
                                            level = 'Info';
                                            message = `${Array.isArray(msg.payload) ? msg.payload.length : 1} Movie/s edited`;
                                            statusMessage = message.toLowerCase();
                                            break;
                                        case 400:
                                            level = 'Error';
                                            message = '400 Bad Request. Check Movie Editor parameters.';
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
                                    statusMessage = "can't edit movie/s";

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

    RED.nodes.registerType('radarr-api-movieeditor-put', RadarrApiMovieEditorPutNode);
};
