module.exports = function (RED) {
    'use strict';
    const request = require('request');

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

    RED.httpAdmin.get('/sonarr-api/:id/:method', RED.auth.needsPermission('sonarr-api.read'), function (req, res, next) {
        let serverNode = RED.nodes.getNode(req.params.id);
        serverNode
            .get(req.params.method)
            .then(function (response) {
                res.send(response.body);
            })
            .catch(function (err) {
                res.send(`Can't get ${req.params.method}s`);
            });
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

    SonarrApiServerNode.prototype.post = function (uri, opts, data, formData) {
        let node = this;
        opts = opts || {};
        opts.apikey = node.credentials.api_key;
        let options = {
            baseUrl: node.credentials.url,
            uri: '/api/v3/' + uri,
            json: true,
            qs: opts,
        };
        if (data) {
            options.body = data;
        }
        if (formData) {
            options.formData = formData;
        }
        return new Promise(function (resolve, reject) {
            request.post(options, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        status: response.statusCode,
                        body: body,
                    });
                }
            });
        });
    };

    SonarrApiServerNode.prototype.put = function (uri, opts, data, formData) {
        let node = this;
        opts = opts || {};
        opts.apikey = node.credentials.api_key;
        let options = {
            baseUrl: node.credentials.url,
            uri: '/api/v3/' + uri,
            json: true,
            qs: opts,
        };
        if (data) {
            options.body = data;
        }
        if (formData) {
            options.formData = formData;
        }
        return new Promise(function (resolve, reject) {
            request.put(options, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        status: response.statusCode,
                        body: body,
                    });
                }
            });
        });
    };

    SonarrApiServerNode.prototype.sendOutput = function (node, msg, sourceType, level, message, statusMessage) {
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

        return;
    };
};
