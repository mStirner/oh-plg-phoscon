module.exports = (info, logger, init) => {
    return init([
        "mdns"
    ], (scope, [
        C_MDNS
    ]) => {

        /**
         * This is a simple implementation of a MDNS record autodiscovering
         * Devices uses unicast addresses to aderverticese their servcies
         * Listen on udp://224.0.0.251:5353
         * 
         * Simple add a dns record, which you want, and wait for advertises
         * For a real scenario implementation, take a look on: 
         * 
         * https://github.com/mStirner/oh-plg-shelly-gen1
         */

        C_MDNS.found({
            type: "A",
            name: "shelly*.local"
        }, (item) => {

            // feedback
            logger.info("MDNS item found", item);

            // callback is fired each time matching multicast packet is received
            // e.g. for shelly*.local:
            // - shellyflood-349454718437.local
            // - shellyrgbw2-4A3E6A.local
            item.match((record) => {

                // record = Object
                // from dns-packet (https://www.npmjs.com/package/dns-packet)

            });

        }, async (filter) => {

            // feedback
            logger.debug("No MDNS record item found, create one with filter", filter);

            // add a new mdns item to component
            // with filter used above
            let item = await C_MDNS.add({
                ...filter
            });

            // feedback
            logger.info("Added MDNS item", item);

        });

    });
};