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

jest.dontMock('../server-support.js');

describe('server-support', () => {
  let serverSupport = require('../server-support.js');
  
  it('edits the issue state correctly when closing a PR', () => {

    var githubMock = {
      issues: {
        edit: jest.genMockFunction()
      }
    };

    serverSupport.closePr(
      githubMock,
      {
        repository: {
          owner: {
            login:'fbsamples'
          },
          name: 'bot-testing'
        },
        pull_request : {
          number:3
        }
      }
    );

    expect(githubMock.issues.edit.mock.calls.length).toBe(1);
    expect(githubMock.issues.edit.mock.calls[0][0]).toEqual({
      number: 3,
      repo: 'bot-testing',
      state: 'closed',
      user: 'fbsamples'
    });
  });
});
