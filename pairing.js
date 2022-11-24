const { promises } = require("../../components/devices/class.adapter");
const request = require("../../helper/request");

module.exports = async (logger, [
    C_DEVICES,
    C_VAULT,
    C_STORE
], info) => {
    try {

        /*
        // draft for a "composing" function for/with components
        // the function call should handle everything waht we do know manuelly
        // it should fetch items based on other items
        // e.g. "Master item" = device instance
        // and everything else where the device is "mentioned" or assigned
                compose([{
                    instance: C_DEVICES,
                    filter: {
                        meta: {
                            manufacturer: "phoscon",
                            model: "raspbee",
                        }
                    }
                }, {
                    instance: C_VAULT,
                    reference: C_DEVICES
                }, {
                    instance: C_STORE,
                    reference: C_DEVICES
                }], (device, vault, store) => {
        
                    // device = matcheing filter
                    // valuet = mathing device
                    // store = mathing device
        
                });
        */

        /*
        [() => {
            return new Promise((resolve) => {

                C_DEVICES.found({
                    meta: {
                        manufacturer: "phoscon",
                        model: "raspbee",
                    }
                }, resolve);

            });
        }, (device) => {
            return new Promise((resolve) => {

                C_STORE.found({
                    namespace: info.uuid,
                    item: device._id
                }, (store) => {
                    resolve([device, store])
                }, async (filter) => {

                    await C_STORE.add({
                        ...filter,
                        config: [{
                            key: "pairing",
                            value: false,
                            type: "boolean",
                            description: `Is device in paring mode? 
                Enable if so. This tells the plugin to aqquire a API Key`
                        }]
                    });

                });

            });
        }].reduce((prev, cur) => {

            return prev().then(cur);

        }).then(([device, store]) => {

            console.log("device & store", device, store);


            let config = store.lean();
            let events = store.changes();

            events.on("changed", (key, value) => {
                if (key === "pairing" && value) {

                    logger.info(`Gateway "${device.name}" is in paring mode`);
                    logger.debug("Optain API key");

                    // get http interface
                    let iface = device.interfaces.find(({ settings }) => {
                        return settings.port === 80;
                    });

                    // create http agent
                    let agent = iface.httpAgent();

                    request(`http://${iface.settings.host}:${iface.settings.port}/api`, {
                        method: "POST",
                        agent,
                        body: JSON.stringify({
                            devicetype: "OpenHaus"
                        }),
                        headers: {
                            "content-type": "application/json"
                        }
                    }, (err, result) => {
                        if (err) {

                            logger.error("Could not fulfill pairing request", err);

                        } else {


                            if (result.body[0]?.success) {
                                C_VAULT.found({
                                    identifier: device._id,
                                    name: `${device.name} API key`,
                                }, (vault) => {
                                    try {

                                        // save aqqueried key
                                        vault.secrets[0].encrypt(result.body[0].success.username);

                                        logger.info("API key aqquiered");

                                        // pairing completed
                                        config.pairing = false;

                                    } catch (err) {

                                        logger.erorr("Could not store api key")

                                    }
                                }, async (filter) => {
                                    try {

                                        // create new vault if no one is found
                                        await C_VAULT.add({
                                            ...filter,
                                            secrets: [{
                                                key: "api_key",
                                                name: "API key",
                                            }]
                                        });

                                        logger.debug("vault for api key created");

                                    } catch (err) {

                                        logger.debug("could create vault for api key", err);

                                    }
                                });
                            } else {

                                logger.error("Could not aqqueire API key", result.body[0]?.error?.description);
                                logger.verbose(result.body[0]);

                            }


                        }
                    });


                } else {

                    logger.info(`Gateway "${device.name}" leaved paring mode`);

                }
            });

        }).catch((err) => {

        });
        */

        C_DEVICES.found({
            meta: {
                manufacturer: "phoscon",
                model: "raspbee",
            }
        }, (device) => {

            console.log("Device", device.name);

            C_STORE.found({
                namespace: info.uuid,
                item: device._id
            }, (store) => {

                let config = store.lean();
                let events = store.changes();

                events.on("changed", (key, value) => {
                    if (key === "pairing" && value) {

                        logger.info(`Gateway "${device.name}" is in paring mode`);
                        logger.debug("Optain API key");

                        // get http interface
                        let iface = device.interfaces.find(({ settings }) => {
                            return settings.port === 80;
                        });

                        // create http agent
                        let agent = iface.httpAgent();

                        request(`http://${iface.settings.host}:${iface.settings.port}/api`, {
                            method: "POST",
                            agent,
                            body: JSON.stringify({
                                devicetype: "OpenHaus"
                            }),
                            headers: {
                                "content-type": "application/json"
                            }
                        }, (err, result) => {
                            if (err) {

                                logger.error("Could not fulfill pairing request", err);

                            } else {


                                if (result.body[0]?.success) {
                                    C_VAULT.found({
                                        identifier: device._id,
                                        name: `${device.name} API key`,
                                    }, (vault) => {
                                        try {

                                            // save aqqueried key
                                            vault.secrets[0].encrypt(result.body[0].success.username);

                                            logger.info("API key aqquiered");

                                            // pairing completed
                                            config.pairing = false;

                                        } catch (err) {

                                            logger.erorr("Could not store api key")

                                        }
                                    }, async (filter) => {
                                        try {

                                            // create new vault if no one is found
                                            await C_VAULT.add({
                                                ...filter,
                                                secrets: [{
                                                    key: "api_key",
                                                    name: "API key",
                                                }]
                                            });

                                            logger.debug("vault for api key created");

                                        } catch (err) {

                                            logger.debug("could create vault for api key", err);

                                        }
                                    });
                                } else {

                                    logger.error("Could not aqqueire API key", result.body[0]?.error?.description);
                                    logger.verbose(result.body[0]);

                                }


                            }
                        });


                    } else {

                        logger.info(`Gateway "${device.name}" leaved paring mode`);

                    }
                });

            }, async (filter) => {
                try {

                    // add new config item if nothing is found
                    await C_STORE.add({
                        ...filter,
                        config: [{
                            key: "pairing",
                            value: false,
                            type: "boolean",
                            description: `Is device in paring mode? 
                Enable if so. This tells the plugin to aqquire a API Key`
                        }]
                    });

                } catch (err) {
                    logger.error(err, `Could not add config settings for device: ${filter.item}`);
                }
            });


        });



    } catch (err) {

        logger.error(err, "Could not setup pairing!");

    }
};