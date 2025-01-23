const { WebSocket } = require("ws");

const infinity = require("../../helper/infinity.js");
const debounce = require("../../helper/debounce.js");

module.exports = (logger, [
    C_ENDPOINTS,
    C_DEVICES,
]) => {
    C_DEVICES.found({
        labels: [
            "zigbee=true",
            "phoscon=true",
        ]
    }, async (device) => {
        try {

            let worker = debounce((redo) => {

                let interfaces = device.interfaces.filter(({ type }) => {
                    return type === "ETHERNET";
                });

                let iface = interfaces.find(({ settings }) => {
                    return settings.port === 443;
                });

                let agent = iface.httpAgent();
                let { host, port } = iface.settings;

                agent.on("error", (err) => {
                    logger.error(err, "httpAgent error");
                    redo();
                });


                //agent.on("open", () => {

                let ws = new WebSocket(`ws://${host}:${port}`, {
                    agent
                });


                logger.debug(`Connect to WebSocket interface ${ws.url}`)

                ws.on("error", (err) => {
                    logger.error(err, `WebSocket error on ${ws.url}`);
                    redo();
                });

                ws.on("open", () => {
                    logger.debug(`Connected to ${ws.url}`);
                });


                ws.on("message", async (msg) => {
                    try {

                        // parse json message & extract props
                        let { e, r, uniqueid, state = {} } = JSON.parse(msg);


                        // listen only for sensor changes
                        // TODO: add lights states e.g. "on"
                        if (e === "changed" && r === "sensors") {

                            let endpoint = await C_ENDPOINTS.find({
                                labels: [
                                    `uniqueid=${uniqueid}`
                                ]
                            });

                            if (endpoint) {

                                let t = endpoint.labels.value(uniqueid);

                                let s = endpoint.states.find(({ alias }) => {
                                    return alias === t;
                                });

                                if (s) {

                                    let k = Object.keys(state).find((key) => {
                                        return key.toLowerCase() !== "lastupdated"
                                    });

                                    // feedback
                                    logger.verbose(`${uniqueid}/${endpoint.name} (${t}) = ${state[k]}`);

                                    // convert
                                    // https://dresden-elektronik.github.io/deconz-rest-doc/endpoints/sensors/#supported-state-attributes
                                    if (t === "ZHATemperature" || t === "ZHAHumidity") {
                                        s.value = state[k] / 100;
                                        return;
                                    }

                                    s.value = state[k];

                                } else {

                                    // feedback
                                    logger.verbose(`No state for uniqueid "${uniqueid}"/"${t}" found`);

                                }

                            } else {

                                // feedback
                                logger.verbose(`No endpoint for uniqueid "${uniqueid}" found`);

                            }

                        }

                    } catch (err) {

                        // feedback
                        logger.warn(err, "Could not handle endpoint state change update");

                    }
                });

                //});


            }, 1000);


            infinity(worker, 5000);

        } catch (err) {

            logger.error(err, "Could not setup endpoint handling");

        }
    });
};