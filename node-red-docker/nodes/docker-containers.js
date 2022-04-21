module.exports = function (RED) {
    'use strict';

    function DockerContainersNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.status({});

        let dockerContainersOptions = [
            {
                value: 'containers-list',
                method: 'GET',
                uri: (none) => `/containers/json?all=true`,
                loadingStepMessage: 'obtaining containers',
                successStepMessage: (msg) => `${Array.isArray(msg.payload) ? msg.payload.length : 1} Container/s returned`,
                container_id: false,
            },
            {
                value: 'constainers-top',
                method: 'GET',
                uri: (container_id) => `/containers/${container_id}/top`,
                loadingStepMessage: 'obtaining container processes',
                successStepMessage: (none) => 'Container Processes returned',
                container_id: 'required',
            },
            {
                value: 'containers-inspect',
                method: 'GET',
                uri: (container_id) => `/containers/${container_id}/json`,
                loadingStepMessage: 'obtaining container info',
                successStepMessage: (none) => 'Container Info returned',
                container_id: 'required',
            },
            {
                value: 'containers-stats',
                method: 'GET',
                uri: (container_id) => `/containers/${container_id}/stats?stream=false`,
                loadingStepMessage: 'obtaining container stats',
                successStepMessage: (none) => 'Container Stats returned',
                container_id: 'required',
            },
            {
                value: 'containers-start',
                method: 'POST',
                uri: (container_id) => `/containers/${container_id}/start`,
                loadingStepMessage: 'starting container',
                successStepMessage: (none) => 'Container Started',
                container_id: 'required',
            },
            {
                value: 'containers-stop',
                method: 'POST',
                uri: (container_id) => `/containers/${container_id}/stop`,
                loadingStepMessage: 'stoping container',
                successStepMessage: (none) => 'Container Stoped',
                container_id: 'required',
            },
            {
                value: 'containers-restart',
                method: 'POST',
                uri: (container_id) => `/containers/${container_id}/restart`,
                loadingStepMessage: 'restarting container',
                successStepMessage: (none) => 'Container Restarted',
                container_id: 'required',
            },
        ];
        let dockerContainersFields = ['container_id'];

        let credentials = RED.nodes.getCredentials(config.server);
        if (!credentials) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: No credentials configured.');
        } else if ((!credentials.host_name || !credentials.port) && !credentials.socket_path) {
            node.status({ fill: 'red', shape: 'ring', text: 'invalid credentials' });
            node.error('Error: Credentials configured incorrectly.');
        } else {
            this.server = RED.nodes.getNode(config.server);

            node.on('input', function (msg) {
                let server = this.server;
                let nodeType = `docker-containers`;

                let level = 'Other';
                let statusMessage = 'unknown status';
                let message = 'Unknown Status.';

                let selCommand = dockerContainersOptions.find((x) => x.value === config.command_name);
                if (!selCommand) {
                    level = 'Critical';
                    message = 'Command Name not found or incorretly configured.';
                    statusMessage = 'command_name error';

                    server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                    return;
                } else {
                    nodeType = `docker-${selCommand.value}`;
                    node.status({ fill: 'blue', shape: 'dot', text: selCommand.loadingStepMessage });
                }

                let anyRequiredVarWrongConfigured = false;
                dockerContainersFields.forEach(function (field) {
                    let container_id = RED.util.evaluateNodeProperty(config.container_id, config.container_id_type || 'str', node, msg);
                    if (selCommand[field] === 'required' && !container_id) {
                        level = 'Critical';
                        message = `${field} not found or incorretly configured.`;
                        statusMessage = `${field} error`;

                        server.sendOutput(node, msg, nodeType, level, message, statusMessage);
                        anyRequiredVarWrongConfigured = true;
                    }
                });

                if (anyRequiredVarWrongConfigured) {
                    return;
                }

                try {
                    let container_id = RED.util.evaluateNodeProperty(config.container_id, config.container_id_type || 'str', node, msg);
                    server
                        .request(selCommand.uri(container_id), selCommand.method)
                        .then(function (response) {
                            switch (response.status) {
                                case 200:
                                case 204:
                                    msg.payload = response.body;
                                    level = 'Info';
                                    message = selCommand.successStepMessage(msg);
                                    statusMessage = message.toLowerCase();
                                    break;
                                case 304:
                                    level = 'Warn';
                                    message = `304 Not Modified. ${selCommand.successStepMessage(msg)} already`;
                                    statusMessage = `${selCommand.successStepMessage(msg)} already`.toLowerCase();
                                    break;
                                case 400:
                                    level = 'Error';
                                    message = `400 Bad Request. ${response.body.message}`;
                                    statusMessage = '400 bad request';
                                    break;
                                case 404:
                                    level = 'Error';
                                    message = `404 Not Found. ${response.body.message}`;
                                    statusMessage = '404 not found';
                                    break;
                                case 500:
                                    level = 'Error';
                                    message = `500 Internal Server Error. ${response.body.message}`;
                                    statusMessage = '500 internal server error';
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
                            statusMessage = "can't send container/s command";
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

    RED.nodes.registerType('docker-containers', DockerContainersNode);
};
