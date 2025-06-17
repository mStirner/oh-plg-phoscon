const request = require("../../helper/request.js");

function rgbToHue(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let hue;

    if (max === min) {
        hue = 0; // Achromatic (gray)
    } else {
        let d = max - min;
        switch (max) {
            case r:
                hue = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                hue = (b - r) / d + 2;
                break;
            case b:
                hue = (r - g) / d + 4;
                break;
        }
        hue *= 60;
    }

    return hue;

}

function rgbToHueDeconz(r, g, b) {
    let hueDeg = rgbToHue(r, g, b); // Ermittelt den Farbton in Grad (0-360)
    let hueDeconz = Math.round(hueDeg * (65535 / 360)); // Skaliert auf 0-65535
    return hueDeconz;
}


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

            agent.on("error", (err) => {
                logger.error(err, "httpAgent error");
            });


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

                    endpoint.commands.forEach((cmd) => {
                        cmd.setHandler(({ params }, done) => {

                            //console.log("Custom command handler set for cmd", cmd._id, iface);
                            let body = {
                                on: false,
                                // bri
                                // hue
                                // sat
                                sat: 255
                            };

                            if (cmd.alias === "ON") {

                                body.on = true;

                            } else if (cmd.alias === "OFF") {

                                body.on = false;

                            } else if (cmd.alias === "COLOR") {

                                let { r, g, b } = params.lean();

                                body.on = true;

                                // convert color params to hue
                                body.hue = rgbToHueDeconz(r, g, b);

                            } else if (cmd.alias === "SATURATION") {

                                let { saturation = 255 } = params.lean();

                                body.on = true;
                                body.sat = saturation;

                            } else if (cmd.alias === "BRIGHTNESS") {


                                let { brightness = 255 } = params.lean();

                                body.on = true;
                                body.bri = brightness;

                            } else {

                                logger.warn("alias not set/on/off, got", cmd.alias)

                            }


                            request(`http://${host}:${port}/api/${secret}/lights/${id}/state`, {
                                agent,
                                body: JSON.stringify(body),
                                method: "PUT"
                            }, (err, result) => {
                                if (err) {

                                    logger.error(err, "error reuqest")
                                    done(err, false);

                                } else {

                                    logger.verbose("request response", result.body);
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