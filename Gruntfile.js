const pkg = require("./package.json");
const cp = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


const PATH_DIST = path.resolve(process.cwd(), "dist");
const PATH_BUILD = path.resolve(process.cwd(), "build");

process.env = Object.assign({
    NODE_ENV: "production"
}, process.env);

module.exports = function (grunt) {

    grunt.initConfig({
        pkg,
        uglify: {
            options: {
                mangle: {
                    toplevel: true
                }
            },
            build: {
                files: [{
                    expand: true,
                    src: [
                        "**/*.js",
                        "**/*.gitkeep",
                        "!Gruntfile.js",
                        "!node_modules/**",
                        "!wizard/**"
                    ],
                    dest: PATH_BUILD,
                }]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("build", () => {
        [
            `rm -rf ${path.join(PATH_BUILD, "/*")}`,
            `rm -rf ${path.join(PATH_DIST, "/*")}`,
            `mkdir -p ${PATH_BUILD}`,
            `mkdir -p ${PATH_DIST}`,
            "grunt uglify",
        ].forEach((cmd) => {
            cp.execSync(cmd, {
                env: process.env,
                stdio: "inherit"
            });
        });
    });

    grunt.registerTask("compress", () => {
        cp.execSync(`cd ${PATH_BUILD} && tar -czvf ${path.join(PATH_DIST, `${pkg.name}.tgz`)} *`, {
            env: process.env,
            stdio: "inherit"
        });
    });

    grunt.registerTask("checksum", () => {

        let m5f = path.join(PATH_DIST, "./checksums.md5");

        fs.rmSync(m5f, { force: true });
        let files = fs.readdirSync(PATH_DIST);
        let fd = fs.openSync(m5f, "w");

        files.forEach((name) => {

            let file = path.join(PATH_DIST, name);
            let content = fs.readFileSync(file);
            let hasher = crypto.createHash("md5");
            let hash = hasher.update(content).digest("hex");
            fs.writeSync(fd, `${hash}\t${name}${os.EOL}`);

        });

        fs.closeSync(fd);

    });

    grunt.registerTask("release", () => {
        [
            "grunt build",
            "grunt compress",
            "grunt checksum"
        ].forEach((cmd) => {
            cp.execSync(cmd, {
                env: process.env,
                stdio: "inherit"
            });
        });
    });

};