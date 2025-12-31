const { URL } = require("url");

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

                    // HUE BRIDGE:
                    // NOTIFY * HTTP/1.1
                    // HOST: 239.255.255.250:1900
                    // CACHE-CONTROL: max-age=100
                    // LOCATION: http://192.168.2.30:80/description.xml
                    // SERVER: Hue/1.0 UPnP/1.0 IpBridge/1.73.0
                    // NTS: ssdp:alive
                    // hue-bridgeid: 001788FFFE723AF6
                    // NT: uuid:2f402f80-da50-11e1-9b23-001788723af6
                    // USN: uuid:2f402f80-da50-11e1-9b23-001788723af6

                    // PHOSCON GATEWAY:
                    // NOTIFY * HTTP/1.1
                    // HOST: 239.255.255.250:1900
                    // CACHE-CONTROL: max-age=100
                    // LOCATION: http://192.168.2.4:80/description.xml
                    // SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.26.0
                    // GWID.phoscon.de: 00212EFFFF03FFC9
                    // hue-bridgeid: 00212EFFFF03FFC9
                    // NTS: ssdp:alive
                    // NT: uuid:54cedf9a-9cbe-4048-925c-840fda7c65a4
                    // USN: uuid:54cedf9a-9cbe-4048-925c-840fda7c65a4

                    if ("location" in headers && "server" in headers && headers["hue-bridgeid"] && headers["gwid.phoscon.de"]) {

                        // extract hostname from ssdp header
                        let { hostname } = new URL(headers.location);

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
                                serial: headers["hue-bridgeid"]
                            },
                            labels: [
                                "zigbee=true",
                                "phoscon=true",
                                `serial=${headers["hue-bridgeid"]}`
                            ]
                        });

                    }

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
