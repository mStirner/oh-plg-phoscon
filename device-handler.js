const request = require("../../helper/request");
const infinity = require("../../helper/infinity.js");
const debounce = require("../../helper/debounce.js");

module.exports = async (logger, [
    C_DEVICES,
    C_ENDPOINTS,
    C_VAULT
], info) => {

    C_DEVICES.found({
        labels: [
            "zigbee=true",
            "phoscon=true",
        ]
    }, async (device) => {
        try {

            let interfaces = device.interfaces.filter(({ type }) => {
                return type === "ETHERNET";
            });

            let iface = interfaces.find(({ settings }) => {
                return settings.port === 80;
            });

            let agent = iface.httpAgent();
            let { host, port } = iface.settings;


            C_VAULT.found({
                identifier: device._id
                /*
                labels: [
                    `device=${device._id}`
                ]
                */
            }, async (vault) => {

                // feels hacky and produces duplicate output
                // see file "endpoint-handler.js", same issue...
                if (vault.secrets[0].value === null) {
                    await new Promise((resolve) => {

                        // feedback for user
                        // TODO: if available, here should be a notification published
                        logger.debug("API token not acquire, wait for one...");
                        logger.info(`Set the Gateway in pairing mode, and set the pairing config value to "true" to acquire a API key`);

                        vault.changes().once("changed", ({ name }) => {

                            logger.debug(`Vault secret "${name}" changed`);
                            resolve();

                        });

                    });
                }

                let secret = vault.secrets[0].decrypt();


                // TODO: Improve this
                // what would be a  better way to check if connection is available?
                // The connector needs to be restarted to fire this...
                let worker = infinity((redo) => {

                    // fetch lights
                    // see: https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/lights/
                    request(`http://${host}:${port}/api/${secret}/lights/`, {
                        agent
                    }, async (err, result) => {
                        if (err) {

                            logger.error("Could not fetch lights endpoints", err);
                            redo();

                        } else {
                            for (key in result.body) {

                                let item = result.body[key];

                                let endpoint = await C_ENDPOINTS.find({
                                    device: device._id,
                                    labels: [
                                        `uniqueid=${item.uniqueid}`
                                    ]
                                });

                                if (endpoint) {

                                    // endpoint found, do nothing
                                    logger.verbose(`Endpoint "${endpoint.name}" exists`);

                                } else {

                                    // feedback
                                    logger.debug(`Add endpoint (light) "${item.name}"`);

                                    C_ENDPOINTS.add({
                                        name: item.name,
                                        device: device._id,
                                        icon: "fa-solid fa-lightbulb",
                                        commands: [{
                                            name: "On",
                                            alias: "ON",
                                            interface: iface._id
                                        }, {
                                            name: "Off",
                                            alias: "OFF",
                                            interface: iface._id
                                        }],
                                        /*
                                        states: [{
                                            name: "On",
                                            alias: "on",
                                            type: "boolean"
                                        }],
                                        */
                                        labels: [
                                            `uniqueid=${item.uniqueid}`,
                                            `identifier=${key}`
                                        ]
                                    }, (err, item) => {
                                        if (err) {
                                            logger.error(err, "Could not add endpoint");
                                        } else {
                                            logger.info(`Endpoint "${item.name}" added`);
                                        }
                                    });

                                }

                            }
                        }
                    });


                    // fetch sensors
                    // see: https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/sensors/
                    request(`http://${host}:${port}/api/${secret}/sensors/`, {
                        agent
                    }, async (err, result) => {
                        if (err) {

                            logger.error("Could not fetch lights endpoints", err);
                            redo();

                        } else {

                            let groups = {};

                            // group sensors by name
                            // each array entry is a sensor type
                            // e.g: "ZHAPressure", "ZHABattery", "ZHATemperature", "ZHASwitch"
                            // see: https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/sensors/#supported-state-attributes
                            for (key in result.body) {

                                let item = result.body[key];

                                if (!groups[item.name]) {
                                    groups[item.name] = [];
                                }

                                groups[item.name].push(item);

                            }


                            Object.keys(groups).forEach(async (key) => {

                                let labels = groups[key].map(({ uniqueid }) => {
                                    return `uniqueid=${uniqueid}`;
                                });

                                let endpoint = await C_ENDPOINTS.find({
                                    labels
                                });


                                if (endpoint) {

                                    // endpoint found, do nothing
                                    logger.verbose(`Endpoint "${endpoint.name}" exists`);

                                } else {

                                    // feedback
                                    logger.debug(`Add endpoint (sensor) "${key}"`);


                                    // https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/sensors/#supported-state-attributes
                                    let states = groups[key].map(({ type, state }) => {
                                        if (type === "ZHABattery") {

                                            return {
                                                name: "Battery (%)",
                                                alias: "ZHABattery",
                                                type: "number",
                                                //icon: "fa-solid fa-battery-three-quarters"
                                            };

                                        } else if (type === "ZHAPressure") {

                                            return {
                                                name: "Ambient pressure (hPa)",
                                                alias: "ZHAPressure",
                                                type: "number",
                                                max: 10000,
                                                //icon: "fa-solid fa-arrows-down-to-line"
                                            };

                                        } else if (type === "ZHAHumidity") {

                                            return {
                                                name: "Humidity (%)",
                                                alias: "ZHAHumidity",
                                                type: "number",
                                                max: 10000,
                                                //icon: "fa-solid fa-percent"
                                            };

                                        } else if (type === "ZHATemperature") {

                                            return {
                                                name: "Temperature (°C)",
                                                alias: "ZHATemperature",
                                                type: "number",
                                                //icon: "fa-solid fa-temperature-half"
                                            }

                                        } else {

                                            // ignore shitty type
                                            // not sure about this checking/states building...
                                            return null;

                                        }
                                    }).filter((state) => {
                                        return state !== null;
                                    });

                                    // this is needed to create a mapping between state alias
                                    // and websocket message event
                                    let stateLabels = groups[key].map(({ type, uniqueid }) => {
                                        return `${uniqueid}=${type}`;
                                    });


                                    /*
                                    // In websocket message, no config/battery prop, so ignore this hacky shit
                                    if (groups[key]?.config?.battery && !states.find(v => v.alias === "ZHABattery")) {
                                        stateLabels.push({
                                            name: "Battery",
                                            alias: "ZHABattery",
                                            type: "number"
                                        });
                                    }
                                    */


                                    C_ENDPOINTS.add({
                                        name: key,
                                        device: device._id,
                                        icon: "fa-solid fa-tachometer-alt",
                                        commands: [],
                                        states: states,
                                        labels: [
                                            ...labels,
                                            ...stateLabels
                                        ]
                                    }, (err, item) => {
                                        if (err) {
                                            logger.error(err, "Could not add endpoint");
                                        } else {
                                            logger.info(`Endpoint "${item.name}" added`);
                                        }
                                    });

                                }

                            });

                        }
                    });

                });

                debounce(worker, 3000);

            });

        } catch (err) {

            // feedback
            logger.error(err, "Could not setup device handling");

        }
    });

};