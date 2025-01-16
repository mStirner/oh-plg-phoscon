module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
        "plugins",
        "rooms",
        "ssdp",
        "store",
        "users",
        "vault"
    ], (scope, [
        C_DEVICES,
        C_ENDPOINTS,
        C_PLUGINS,
        C_ROOMS,
        C_SSDP,
        C_STORE,
        C_USERS,
        C_VAULT
    ]) => {


        // do something here with the components
        // documentation about them can be found on:
        // https://docs.open-haus.io/#/backend/components/


        // scope = plugin class instace
        console.log(scope);


        // example logger usage
        logger.trace("Hello World from plugin ", info.name);
        logger.verbose("Hello World from plugin ", info.name);
        logger.debug("Hello World from plugin ", info.name);
        logger.info("Hello World from plugin ", info.name);
        logger.warn("Hello World from plugin ", info.name);
        logger.error("Hello World from plugin ", info.name);


    });
};