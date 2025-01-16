import { readFileSync, writeFileSync } from "node:fs"
import { cwd } from "node:process";
import { join, basename } from "node:path";
import { EOL } from "node:os";


export default () => {
    try {

        // use `execSync("npm config set name=foo");` instead?

        const json = JSON.parse(readFileSync(join(cwd(), "package.json")));

        json.name = basename(cwd());

        writeFileSync(join(cwd(), "package.json"), `${JSON.stringify(json, null, 2)}${EOL}`, {
            encoding: "utf8"
        });

    } catch (err) {

        console.error(err);
        process.exit(5);

    }
}