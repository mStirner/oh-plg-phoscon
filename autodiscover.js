const { URL } = require("url");

// import helper functions
const _waterfall = require("../../helper/waterfall");

module.exports = async (logger, [
    C_DEVICES,
    C_SSDP
], info) => {
    try {

        C_SSDP.found({
            nt: "urn:schemas-upnp-org:device:basic:1"
        }, (ssdp) => {

            // item found (exists or was added)
            logger.verbose("ssdp item with target NT found!");


            ssdp.match(async (type, headers, description) => {
                try {

                    // extract hostename from ssdp header
                    let { hostname } = new URL(headers.location);
                    let headerKeys = Object.keys(headers);


                    // check if ssdp message match
                    // compare phoscon specific headers
                    await new Promise((resolve, reject) => {

                        let matched = [
                            "gwid.phoscon.de",
                            "hue-bridgeid"
                        ].map((v) => {
                            return new RegExp(v, "gi");
                        }).every((regexp) => {
                            return headerKeys.some((key) => {
                                return regexp.test(key);
                            });
                        });

                        if (matched) {
                            resolve();
                        } else {
                            reject();
                        }

                    });


                    // check if device exists
                    // compare hostname with interface host
                    await new Promise((resolve, reject) => {

                        let exists = C_DEVICES.items.find((device) => {
                            return device.interfaces.filter((iface) => {
                                return iface.type === "ETHERNET";
                            }).map(({ settings: { host } }) => {
                                return host;
                            }).some((host) => {
                                return host === hostname;
                            });
                        });

                        if (exists) {

                            // feedback
                            logger.verbose(`Phoscon gateway with host "${hostname}" exsists`);

                            reject();

                        } else {

                            // feedback
                            logger.debug(`Found new phoscon gateway, with host "${hostname}"`);

                            resolve();

                        }

                    });



                    // add device if not
                    logger.info(`Add new found device (${hostname})`);

                    await C_DEVICES.add({
                        name: `Phoscon Gateway`,
                        icon: "fa-solid fa-wave-square",
                        interfaces: [{
                            type: "ETHERNET",
                            settings: {
                                socket: "tcp",
                                host: hostname,
                                port: 80
                            }
                        }, {
                            type: "ETHERNET",
                            settings: {
                                socket: "tcp",
                                host: hostname,
                                port: 443
                            }
                        }],
                        meta: {
                            manufacturer: "phoscon",
                            model: "raspbee",
                            serial: headers["gwid.phoscon.de"]
                        },
                        labels: [
                            "zigbee=true",
                            "phoscon=true",
                            `serial=${headers["gwid.phoscon.de"]}`
                        ]
                    });


                } catch (err) {
                    if (err) {

                        // feedback
                        logger.error(err, "Could not add device");

                    } else {

                        // no error passed
                        // ignore

                    }
                }
            });
        }, ({ nt }) => {

            // item not found, add new item
            logger.verbose("No ssdp item with target NT found, add one");

            C_SSDP.add({
                nt
            });

        });


    } catch (err) {

        logger.error(err, "Could not setup device discovering!");

    }
};