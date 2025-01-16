module.exports = (info, logger, init) => {
    return init([
        "ssdp"
    ], (scope, [
        C_SSDP
    ]) => {

        /**
         * This implements a SSDP discovering
         * Listen for broadcast messages on udp://239.255.255.250:1900
         * 
         * Implementation used here: https://github.com/mStirner/oh-plg-phoscon
         */

        C_SSDP.found({
            nt: "urn:schemas-upnp-org:device:basic:1"
        }, (item) => {

            // feedback
            logger.info("SSDP item found", item);

            // callback is fired each time matching multicast packet is received
            ssdp.match((type, headers, description) => {

                // example ssdp message:
                // NOTIFY * HTTP/1.1
                // HOST: 239.255.255.250:1900
                // CACHE-CONTROL: max-age=100
                // LOCATION: http://192.168.2.4:80/description.xml
                // SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.26.0
                // GWID.phoscon.de: 00212EFFFF03FFC9
                // hue-bridgeid: 00212EFFFF03FFC9
                // NTS: ssdp:alive
                // NT: upnp:rootdevice
                // USN: uuid:54cedf9a-9cbe-4048-925c-840fda7c65a4::upnp:rootdevice

                // type = NOTIFY
                // headers = SSDP headers key/values above
                // desciprtion = xml content from http://192.168.2.4:80/description.xml

            });

        }, async (filter) => {

            // feedback
            logger.debug("No SSDP item found, create one", filter);

            // add a new SSDP item to component
            // with filter used above
            let item = await C_SSDP.add({
                ...filter
            });

            // feedback
            logger.info("Added SSDP item", item);

        });

    });
};