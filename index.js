module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
        "ssdp",
        "vault",
        "store"
    ], async (scope, [
        C_DEVICES,
        C_ENDPOINTS,
        C_SSDP,
        C_VAULT,
        C_STORE
    ]) => {


        // Phase 1: Autodiscover device & add it
        require("./autodiscover.js")(logger, [
            C_DEVICES,
            C_SSDP,
            C_STORE
        ], info);


        // Phase 2: Pair device & get API key
        require("./pairing.js")(logger, [
            C_DEVICES,
            C_VAULT,
            C_STORE
        ], info);


        // Phase 3: Handle added device & fetch endpoints
        require("./device-handler.js")(logger, [
            C_DEVICES,
            C_ENDPOINTS,
            C_VAULT
        ], info);


        // Phase 4: Handle endpoints & setup command/state handler
        require("./endpoint-handler.js")(logger, [
            C_ENDPOINTS,
            C_DEVICES,
            C_VAULT
        ], info);


        // Phase 5: Handle state changes for endpoints
        require("./state-handler.js")(logger, [
            C_ENDPOINTS,
            C_DEVICES
        ], info);


    });
};