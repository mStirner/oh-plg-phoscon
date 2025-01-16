module.exports = (info, logger, init) => {
    return init([
        "rooms",
    ], async (scope, [
        C_ROOMS,
    ]) => {

        /**
         * This is a exmaple of basic component usage
         * 
         * Below is the "room" component used to create 2 rooms
         * The component is injected from the plugin class
         * 
         * A component can be used when its registred as intents
         */

        // feedback
        logger.debug(`Create "Room #1"`);


        // use .add method to create a room item
        const room1 = await C_ROOMS.add({
            name: "Room #1"
        });


        // feedback
        logger.info(`Created "Room #1"`, room1);
        logger.debug(`Create "Room #2"`);


        // add a second room item
        const room2 = await C_ROOMS.add({
            name: "Room #2",
            number: 2002,
            labels: [
                "restricted=true",
                "locked=true",
                "foo=bar"
            ]
        });


        // feedback
        logger.info(`Created "Room #2"`, room2);


        // .items array length = 2
        // it contains now boht room items create above
        console.log(C_ROOMS.items);

    });
};