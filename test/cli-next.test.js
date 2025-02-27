/*
 * Copyright 2021 Adobe. All rights reserved.
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

// skip for now until the new way of testing the next aio-cli version is ready
it.skip("should install (next) version of aio-cli and run developer experience", async function() {

    shell(`
        npm install --no-save adobe/aio-cli#branch-prerelease
        npx aio-next info
        mkdir project
        cd project
        npx aio-next app:init --no-login -i ../test/console.json -e dx/asset-compute/worker/1
    `);

    assert(fs.existsSync("project/src/dx-asset-compute-worker-1/actions/worker/index.js"));

    // this could be where tests are run ...
    shell(`npx aio-next app:info`, 'project');
    shell(`npx aio-next plugins:install @adobe/aio-cli-plugin-asset-compute`);
    shell(`npx aio-next asset-compute:test-worker`, 'project');

    // clean up
    shell(`rm -rf project`);
}).timeout(600000);
