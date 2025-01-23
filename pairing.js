const request = require("../../helper/request");

module.exports = async (logger, [
    C_DEVICES,
    C_VAULT,
    C_STORE
], info) => {

    C_DEVICES.found({
        labels: [
            "zigbee=true",
            "phoscon=true",
        ]
    }, async (device) => {


        // create/get config store for device
        // holds things like "ready for pairing"
        let store = new Promise((resolve) => {
            C_STORE.found({
                labels: [
                    `device=${device._id}`,
                    "zigbee=true",
                    "phoscon=true"
                ]
            }, (store) => {

                // feedback
                logger.debug(`Store for device "${device.name}" found`);

                resolve(store);

            }, (filter) => {

                // feedback
                logger.verbose(`Add store for device "${device.name}"`)

                C_STORE.add({
                    name: `Phoscon Gateway (${device.name})`,
                    ...filter,
                    config: [{
                        name: "Pairing",
                        key: "pairing",
                        value: false,
                        type: "boolean",
                        description: `Is device in paring mode?\nEnable if so. This tells the plugin to aqquire a API Key`
                    }]
                });

            });
        });


        // create/get vault for secrets
        // stores the API key from the gateway
        let vault = new Promise((resolve) => {
            C_VAULT.found({
                name: `Device "${device.name}" API key`,
                /*
                labels: [
                    `device=${device._id}`
                ]*/
                identifier: device._id
            }, (vault) => {

                // feedback
                logger.debug(`Vault for device "${device.name}" found`);

                resolve(vault);

            }, (filter) => {

                // feedback
                logger.verbose(`Add vault for device "${device.name}"`)

                // create new vault if no one is found
                C_VAULT.add({
                    ...filter,
                    secrets: [{
                        key: "api_key",
                        name: "API key",
                    }]
                });

            });
        });


        // handle pairing changes & get API key
        Promise.all([store, vault]).then(([store, vault]) => {

            let config = store.lean();
            let events = store.changes();
            let timeout = null;

            events.on("changed", (key, value) => {

                // stop previoius autorset
                clearInterval(timeout);

                if (key === "pairing" && value) {

                    logger.debug(`Gateway "${device.name}" is in paring mode`);

                    // get http interface
                    let iface = device.interfaces.find(({ settings }) => {
                        return settings.port === 80;
                    });

                    // create http agent
                    let agent = iface.httpAgent();

                    agent.on("error", (err) => {
                        logger.error(err, "httpAgent error");
                    });


                    // do http request to get api key
                    // see: https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/configuration/#aquireapikey
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

                            // feedback
                            logger.error(err, "Could not fulfill pairing request");

                        } else {
                            if (result.body[0]?.success) {

                                logger.info("API key aqquiered");

                                // pairing completed
                                config.pairing = false;

                                // save aqqueried key
                                vault.secrets[0].encrypt(result.body[0].success.username);

                            } else {

                                // pairing not completed
                                config.pairing = false;

                                logger.error("Could not aqqueire API key:", result.body[0]?.error?.description);
                                logger.verbose(result.body[0]);

                            }
                        }
                    });


                    // auto-reset after 60s
                    timeout = setTimeout(() => {
                        config.pairing = false;
                    }, 60000);


                } else {
                    logger.info(`Gateway "${device.name}" leaved paring mode`);
                }

            });

        }).catch((err) => {

            // feedback
            logger.error(err, "Could not setup config/vault setup");

        });


    });

};