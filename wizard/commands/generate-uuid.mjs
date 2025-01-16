import { randomUUID } from "node:crypto";


export default () => {
    try {

        return randomUUID();

    } catch (err) {

        console.error(err);
        process.exit(5);

    }
}