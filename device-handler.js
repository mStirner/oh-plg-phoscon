const request = require("../../helper/request");

module.exports = (logger, [
    C_DEVICES,
    C_ENDPOINTS,
    C_VAULT
]) => {
    try {

        C_DEVICES.found({
            meta: {
                manufacturer: "phoscon",
                model: "raspbee"
            }
        }, (device) => {

            logger.debug(`Gateway found: "${device.name}"`);
            logger.debug(`Update Endpoints assigned to Gateway`);

            // -------------------

            let interfaces = device.interfaces.filter(({ type }) => {
                return type === "ETHERNET";
            });

            let http = interfaces.find(({ settings }) => {
                return settings.port === 80;
            });

            C_VAULT.found({
                identifier: device._id
            }, (vault) => {


                let secret = vault.secrets[0].decrypt();
                let agent = http.httpAgent();


                http.on("attached", () => {


                    console.log("Iface attacheD!!!!")


                    request(`http://${http.settings.host}:${http.settings.port}/api/${secret}/lights/`, {
                        agent
                    }, (err, result) => {
                        if (err) {

                            logger.error("Could not fetch lights endpoints", err);

                        } else {
                            for (key in result.body) {

                                let item = result.body[key];

                                let exists = C_ENDPOINTS.items.find((endpoint) => {
                                    return (endpoint.device === device._id && endpoint.identifier === key);
                                });


                                if (!exists) {
                                    C_ENDPOINTS.add({
                                        name: item.name,
                                        identifier: key,
                                        device: device._id,
                                        icon: "fa-solid fa-lightbulb",
                                        commands: [{
                                            name: "On",
                                            alias: "ON",
                                            interface: http._id
                                        }, {
                                            name: "Off",
                                            alias: "OFF",
                                            interface: http._id
                                        }],
                                        states: [{
                                            name: "On",
                                            alias: "on",
                                            type: "boolean"
                                        }]
                                    }, (err, item) => {
                                        if (err) {
                                            logger.error("Could not add endpoint", err);
                                        } else {
                                            logger.info("Endpoint added", item.name);
                                        }
                                    });
                                }

                            }
                        }
                    });


                    /*
                    request(`http://${http.settings.host}:${http.settings.port}/api/${secret}/sensors/`, {
                        agent
                    }, (err, result) => {
                        if (err) {

                            logger.error("Could not fetch sensor endpoints", err);

                        } else {

                            let mappings = {};

                            // group items by name
                            for (key in result.body) {

                                let item = result.body[key];

                                if (!mappings[item.name]) {
                                    mappings[item.name] = [];
                                }

                                mappings[item.name].push(item);

                            }


                            console.log("mappings", mappings)

                            for (let name in mappings) {

                                let exists = C_ENDPOINTS.items.find((endpoint) => {
                                    return (endpoint.device === device._id && endpoint.identifier === key);
                                });


                                if (!exists) {
                                    C_ENDPOINTS.add({
                                        name,
                                        device: device._id,
                                        icon: "fa-solid fa-tachometer-alt"
                                    }, (err, item) => {
                                        if (err) {
                                            logger.error("Could not add endpoint", err);
                                        } else {
                                            logger.info("Endpoint added", item.name);
                                        }
                                    });
                                }

                            }

                        }
                    });
                    */


                });

            });

            // -------------------


        });

    } catch (err) {

        logger.error(err, "Could not setup device handling!");

    }
};