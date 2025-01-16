const request = require("../../helper/request.js");

module.exports = (logger, [
    C_ENDPOINTS,
    C_DEVICES,
    C_VAULT
]) => {
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
            }, async (vault) => {


                // feels hacky and produces duplicate output
                // see file "device-handler.js", same issue...
                if (vault.secrets[0].value === null) {
                    await new Promise((resolve) => {

                        vault.changes().once("changed", ({ name }) => {

                            logger.debug(`Vault secret "${name}" changed`);
                            resolve();

                        });

                    });
                }

                let secret = vault.secrets[0].decrypt();


                C_ENDPOINTS.found({
                    device: device._id
                }, (endpoint) => {

                    let id = endpoint.labels.value("identifier");

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


                            request(`http://${host}:${port}/api/${secret}/lights/${id}/state`, {
                                agent,
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

            });

        } catch (err) {

            logger.error(err, "Could not setup endpoint handling");

        }
    });
};