/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict"

function closePr(github, data, reject) {
  console.log("close PR", data, reject);

  github.issues.edit({
    user: data.repository.owner.login, // 'fbsamples'
    repo: data.repository.name, // 'bot-testing'
    number: data.pull_request.number, // 23
    state: 'closed'
  }, function(err) {
    if (err) {
      if (typeof reject === 'function') {
        return reject(err);
      }
    }
  })
}

module.exports = {
  closePr
}
