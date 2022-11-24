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

        // first output from plugin
        // this indicates that its loaded and try to do some work
        logger.verbose("Hello from plugin", info);


        (async () => {

            let _id = "637a444b8f0dafbfa0f2b058";

            // update call 1
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "marc.stirner@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "12345678"
                }]
            });


            // update call 2
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "john.doe@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "87654321"
                }]
            });

            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "test@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "S3cret²10"
                }]
            });




            // update call 1
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "marc.stirner@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "12345678"
                }]
            });


            // update call 2
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "john.doe@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "87654321"
                }]
            });

            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "test@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "S3cret²10"
                }]
            });





            // update call 1
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "marc.stirner@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "12345678"
                }]
            });


            // update call 2
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "john.doe@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "87654321"
                }]
            });

            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "test@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "S3cret²10"
                }]
            });




            // update call 1
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "marc.stirner@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "12345678"
                }]
            });


            // update call 2
            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "john.doe@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "87654321"
                }]
            });

            await C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "test@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "S3cret²10"
                }]
            });

        })();

        /*
        Promise.all([



            /*
            // update call 3
            C_VAULT.update(_id, {
                secrets: [{
                    name: "Username",
                    key: "USERNAME",
                    value: "test@example.com"
                }, {
                    name: "Password",
                    key: "PASSWORD",
                    value: "S3cret²10"
                }]
            }),
           
                       // update call 4
                       C_VAULT.update(_id, {
                           secrets: [{
                               name: "Username",
                               key: "USERNAME",
                               value: "marc.stirner@example.com"
                           }, {
                               name: "Password",
                               key: "PASSWORD",
                               value: "12345678"
                           }]
                       }),
           
                       // update call 5
                       C_VAULT.update(_id, {
                           secrets: [{
                               name: "Username",
                               key: "USERNAME",
                               value: "john.doe@example.com"
                           }, {
                               name: "Password",
                               key: "PASSWORD",
                               value: "87654321"
                           }]
                       }),
                       *
        ]).then(([r1, r2, r3, r4, r5]) => {

            console.log("Double update result", r1, r2, r3, r4, r5);


        }).catch((err) => {
            console.error(err);
            process.exit(100);
        });
        */

        return;


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


    });
};