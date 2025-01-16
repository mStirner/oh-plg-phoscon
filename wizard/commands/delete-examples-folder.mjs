import { rmSync } from "node:fs"
import { cwd } from "node:process";
import { join } from "node:path";


export default () => {
    try {

        rmSync(join(cwd(), "examples"), {
            recursive: true,
            force: true
        });

    } catch (err) {

        console.error(err);
        process.exit(5);

    }
}