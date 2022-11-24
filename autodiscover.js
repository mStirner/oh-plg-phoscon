const { URL } = require("url");

// import helper functions
const _waterfall = require("../../helper/waterfall");

module.exports = async (logger, [
    C_DEVICES,
    C_SSDP,
    C_STORE
], info) => {
    try {

        C_SSDP.found({
            nt: "urn:schemas-upnp-org:device:basic:1"
        }, (ssdp) => {

            // item found (exists or was added)
            logger.debug("ssdp item with target NT found!");
            let counter = 0;


            ssdp.match((type, headers, description) => {

                // extract hostename from ssdp header
                let { hostname } = new URL(headers.location);
                let headerKeys = Object.keys(headers);

                _waterfall([
                    (next) => {

                        // check if ssdp message match
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
                            next();
                        }

                    }, (next) => {

                        // check if device exists
                        let exists = C_DEVICES.items.find((device) => {
                            return device.interfaces.filter((iface) => {
                                return iface.type === "ETHERNET";
                            }).map(({ settings: { host } }) => {
                                return host;
                            }).some((host) => {
                                // check here for meta.serial too?!
                                return host === hostname;
                            });
                        });

                        // up goes the number
                        counter += 1;

                        if (!exists) {

                            // feedback
                            logger.verbose(`New device with host interface "${hostname}" found`);

                            next();

                        } else {

                            // device with interface hosts property exists
                            logger.verbose(`Device with host interface "${hostname}" exists`, counter);

                        }

                    }, async () => {
                        try {

                            // add device if not
                            logger.info(`Add new found device`);

                            await C_DEVICES.add({
                                name: `Phoscon Gateway (${headers["gwid.phoscon.de"]})`,
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
                                }
                            });


                        } catch (err) {
                            logger.error(err, "Could not add device/config");
                        }
                    }
                ]);

            });



        }, ({ nt }) => {

            // function parameter is the filter object

            // item not found, add new item
            logger.debug("No ssdp item with target NT found, add one");

            C_SSDP.add({
                nt
            });

        });


    } catch (err) {

        logger.error(err, "Could not setup device discovering!");

    }
};