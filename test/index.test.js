/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';

const assert = require("assert");
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const rimraf = require("rimraf");
process.env.DEBUG = "aio-asset-compute*";

function shell(cmd, dir) {
    cmd = cmd
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith("#"))
        .join(os.platform() === "win32" ? " & " : "; ");

    execSync(cmd, {cwd: dir, stdio: 'inherit'});
}

// create dir (if doesn't exist yet) and change into it
function cd(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    process.chdir(dir);
}

describe("integration tests", function() {

    const BUILD_DIR = path.resolve("build"); // absolute paths required below

    beforeEach(function() {
        this.timeout(30000);

        // make npm global installations go into a specific directory
        // to avoid messing with a user's actual global npm installations
        // Note: npm_config_prefix must be lowercase!
        process.env.npm_config_prefix = path.resolve(BUILD_DIR, "npm");

        // npm bin path is different on windows, ask npm for the exact path
        const npmBinPath = execSync("npm bin -g").toString().trim();
        process.env.PATH = `${npmBinPath}${path.delimiter}${process.env.PATH}`;

        // reset/clear build dir entirely before each run
        rimraf.sync(BUILD_DIR);

        cd(BUILD_DIR);
    });

    it("should install lastest version of tools and run developer experience", async function() {
        shell(`
            npm install -g @adobe/aio-cli@9.4.1
            aio info
        `);

        cd("project");

        shell(`aio app:init --no-login -i ../../test/console.json -t @adobe/generator-app-asset-compute@1.0.2`);
        shell('ls');
        assert(fs.existsSync(path.join("src", "dx-asset-compute-worker-1", "actions", "worker", "index.js")));

        const testLogsFile = path.join("build", "test-results", "test-worker", "test.log");
        assert.ok(!fs.existsSync(testLogsFile));
        shell(`
            aio app test
        `);
        assert.ok(fs.existsSync(testLogsFile));
        const testLogs = fs.readFileSync(testLogsFile);
        assert.ok(testLogs.includes('Validation successful'));

        // test as aio plugin
        shell(`
            aio plugins:install @adobe/aio-cli-plugin-asset-compute
            aio asset-compute test-worker
        `);
    }).timeout(600000);
});
