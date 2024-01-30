const request = require("../../helper/request.js");

module.exports = (logger, [
    C_ENDPOINTS,
    C_DEVICES,
    C_VAULT
]) => {
    try {



        C_DEVICES.found({
            meta: {
                manufacturer: "phoscon",
                model: "raspbee"
            }
        }, (device) => {
            C_VAULT.found({
                identifier: device._id
            }, (vault) => {

                let iface = device.interfaces.find(({ settings }) => {
                    return settings.port === 80;
                });

                let secret = vault.secrets[0].decrypt();
                let agent = iface.httpAgent();

                //iface.on("attached", () => {

                C_ENDPOINTS.items.filter((endpoint) => {
                    return endpoint.device === device._id;
                }).forEach((endpoint) => {


                    endpoint.commands.forEach((command) => {
                        command.setHandler((cmd, iface, params, done) => {

                            //console.log("Custom command handler set for cmd", cmd._id, iface);

                            let on = false;

                            if (cmd.alias === "ON") {
                                on = true;
                            } else if (cmd.alias === "OFF") {
                                on = false;
                            } else {
                                console.log("alias not set/on/off")
                            }


                            request(`http://${iface.settings.host}:${iface.settings.port}/api/${secret}/lights/${endpoint.identifier}/state`, {
                                agent,
                                //NOTE:
                                // Keep tcp socket open
                                // how to set this via agent?
                                headers: {
                                    "Connection": "Keep-Alive"
                                },
                                body: JSON.stringify({
                                    on
                                }),
                                method: "PUT"
                            }, (err, result) => {
                                if (err) {

                                    console.log("error reuqest", err)
                                    done(err, false);

                                } else {

                                    console.log("request response", result.body);
                                    done(null, true)

                                }
                            });

                        });
                    });


                });

                //});













            });
        });
    } catch (err) {

        logger.error(err, "Could not setup endpoint handling!");

    }
};