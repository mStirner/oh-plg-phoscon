import { execSync } from "node:child_process";
import { basename, join } from "node:path";
import { cwd, env } from "node:process";
import { rmSync } from "node:fs";
import inquirer from "inquirer";


if (env.SKIP_WIZARD) {
    process.exit(0);
}


const [
    delete_examples_folder,
    set_pkg_name,
    generate_uuid
] = await Promise.all([
    import("./commands/delete-examples-folder.mjs"),
    import("./commands/set-pkg-name.mjs"),
    import("./commands/generate-uuid.mjs"),
]).then((arr) => {
    return arr.map((obj) => {
        return obj.default;
    });
});

console.clear();

const questions = [{
    type: "confirm",
    name: "delete_examples_folder",
    message: "Delete examples folder",
    default: true
}, {
    type: "confirm",
    name: "set_pkg_name",
    message: `Set package.json name to "${basename(cwd())}"`,
    default: true
}, {
    type: "confirm",
    name: "generate_uuid",
    message: "Generate plugin UUID",
    default: true
}, {
    type: "confirm",
    name: "remove_setup_wizard",
    message: "Remove setup wizard",
    default: true
},];

inquirer.prompt(questions).then((answers) => {

    if (answers.delete_examples_folder) {
        delete_examples_folder();
    }

    if (answers.set_pkg_name) {
        set_pkg_name();
    }

    if (answers.generate_uuid) {
        console.log(`UUID = ${generate_uuid()}`);
    }

    if (answers.remove_setup_wizard) {

        execSync("npm config delete scripts.postinstall");
        execSync("npm uninstall inquirer");

        rmSync(join(cwd(), "wizard"), {
            recursive: true,
            force: true
        });

    }

}).catch((err) => {
    if (err.isTtyError) {

        console.error(err);

    } else {

        console.error(err);
        process.exit(3);

    }
});