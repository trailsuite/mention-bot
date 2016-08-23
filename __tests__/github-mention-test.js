/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

jest
  .dontMock('../mention-bot.js')
  .dontMock('download-file-sync')
  .dontMock('fs')
  .dontMock('minimatch');

require.requireActual('babel-polyfill');
var mentionBot = require('../mention-bot.js');
var fs = require('fs');

describe('Github Mention', function() {

  function getFile(filename) {
    return fs.readFileSync(__dirname + '/data/' + filename, 'utf8');
  }

  xdescribe('Debugging', function() {
    // If you are working on the algorithm itself, it is useful to be able to run
    // the complete flow that downloads the diff and subsequent blames. Since
    // doing http requests is unreliable in tests, it is disabled by default.
    xit('CompleteFlow', function() {
      mentionBot.enableCachingForDebugging = true;
      var prs = [3238];

      var owners = mentionBot.guessOwnersForPullRequest(
        'https://github.com/facebook/react-native',
        i,
        'mention-bot',
        'master',
        {} //config
      ).then(function() {
        prs.forEach(function(i) {
          console.log(i, owners);
        });
      });
    });
  });

  describe('CompleteFlow', function() {

    const reactNativePR = {
      repoName: 'https://github.com/facebook/react-native',
      prNumber: 3238,
      prUser: 'mention-bot',
      prBaseBranch: 'master',
      privateRepo: false,
      org: 'facebook'
    }

    pit('Gets correct users with default config options', function() {
      mentionBot.enableCachingForDebugging = true;
      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        reactNativePR.privateRepo,
        reactNativePR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
        }
      ).then(function(owners) {
        expect(owners).toEqual(['corbt', 'vjeux', 'sahrens']);
      });
    });

    pit('Filters out users that are not in the org if the repo is private', function() {
      mentionBot.enableCachingForDebugging = true;
      var githubMock = {
        orgs: {
          getMembers: jest.genMockFunction().mockImplementation(function(params, cb) {
            cb(null, [
              {login: 'sahrens'},
              {login: 'not-vjeux'},
              {login: 'corbt'}
            ]);
          })
        }
      };

      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        true, //Set privateRepo to true
        reactNativePR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
        },
        githubMock
      ).then(function(owners) {
        expect(githubMock.orgs.getMembers.mock.calls.length).toBe(1);
        expect(githubMock.orgs.getMembers.mock.calls[0][0]).toEqual({
          org: 'facebook',
          page: 0,
          per_page: 100
        });
        expect(owners).toEqual(['corbt', 'sahrens']);
      });
    });

    pit('Handles pagination when getting the org members', function() {
      mentionBot.enableCachingForDebugging = true;
      var onCall = 0;

      //First call to the github api returns 100 results
      var onCall1 = [{login: 'sahrens'}];
      var i = 0;
      for (i; i < 99; i++) {
        onCall1.push({login: 'someone-else'});
      }

      //Second call to the github api returns 2 results
      var onCall2 = [
        {login: 'vjeux'},
        {login: 'corbt'}
      ];

      var githubMock = {
        orgs: {
          getMembers: jest.genMockFunction().mockImplementation(function(params, cb) {
            if(++onCall === 1) {
              cb(null, onCall1);
            } else {
              cb(null, onCall2);
            }
          })
        }
      };

      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        true, //Set privateRepo to true
        reactNativePR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
        },
        githubMock
      ).then(function(owners) {
        expect(githubMock.orgs.getMembers.mock.calls.length).toBe(2);
        expect(githubMock.orgs.getMembers.mock.calls[0][0]).toEqual({
          org: 'facebook',
          page: 0,
          per_page: 100
        });
        expect(githubMock.orgs.getMembers.mock.calls[1][0]).toEqual({
          org: 'facebook',
          page: 1,
          per_page: 100
        });
        expect(owners).toEqual(['corbt', 'vjeux', 'sahrens']);
      });
    });

    pit('Does not get the org members if there is no org', function() {
      mentionBot.enableCachingForDebugging = true;
      var githubMock = {
        orgs: {
          getMembers: jest.genMockFunction()
        }
      };

      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        true, //Set privateRepo to true
        undefined,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
        },
        githubMock
      ).then(function(owners) {
        expect(githubMock.orgs.getMembers.mock.calls.length).toBe(0);
        expect(owners).toEqual(['corbt', 'vjeux', 'sahrens']);
      });
    });

    pit('Gets correct users if `findPotentialReviewers` option is disabled', function() {
        mentionBot.enableCachingForDebugging = true;
        return mentionBot.guessOwnersForPullRequest(
          reactNativePR.repoName,
          reactNativePR.prNumber,
          reactNativePR.prUser,
          reactNativePR.prBaseBranch,
          true, //Set private repo to true
          reactNativePR.org,
          {
            maxReviewers: 3,
            userBlacklist: [],
            fileBlacklist: [],
            requiredOrgs: [],
            numFilesToCheck: 5,
            findPotentialReviewers: false,
            alwaysNotifyForPaths: [{
              name: 'jcsmorais',
              files: ['website/server/*']
            }]
          }
        ).then(function(owners) {
          expect(owners).toEqual(['jcsmorais']);
        });
      });

    pit('Messages 5 users from config option maxUsersToPing', function() {
      mentionBot.enableCachingForDebugging = true;
      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        reactNativePR.privateRepo,
        reactNativePR.org,
        {
          maxReviewers: 5,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
        }
      ).then(function(owners) {
        expect(owners.length).toEqual(5);
      });
    });

    pit('Should contain testname in owners from whitelist', function() {
      mentionBot.enableCachingForDebugging = true;
      return mentionBot.guessOwnersForPullRequest(
        reactNativePR.repoName,
        reactNativePR.prNumber,
        reactNativePR.prUser,
        reactNativePR.prBaseBranch,
        reactNativePR.privateRepo,
        reactNativePR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
          alwaysNotifyForPaths: [
            {
              name: 'ghuser',
              files: ['package.json', '**/*.js', 'README.md']
            }
          ]
        }
      ).then(function(owners) {
        expect(owners.indexOf('ghuser')).toBeGreaterThan(-1);
      });
    });

    const botTestingPR = {
      repoName: 'https://github.com/fbsamples/bot-testing',
      prNumber: 95,
      prUser: 'mention-bot',
      prBaseBranch: 'master',
      privateRepo: false,
      org: 'facebook'
    }

    pit('Should contain testname in owners from fallback', function() {
      mentionBot.enableCachingForDebugging = true;
      return mentionBot.guessOwnersForPullRequest(
        botTestingPR.repoName,
        botTestingPR.prNumber,
        botTestingPR.prUser,
        botTestingPR.prBaseBranch,
        botTestingPR.privateRepo,
        botTestingPR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true,
          fallbackNotifyForPaths: [
            {
              name: 'ghuser',
              files: ['*.js']
            }
          ]
        }
      ).then(function(owners) {
        expect(owners.indexOf('ghuser')).toBeGreaterThan(-1);
      });
    });

    pit('Should not contain testname in owners from fallback when fallback is missing', function() {
      mentionBot.enableCachingForDebugging = true;
      return mentionBot.guessOwnersForPullRequest(
        botTestingPR.repoName,
        botTestingPR.prNumber,
        botTestingPR.prUser,
        botTestingPR.prBaseBranch,
        botTestingPR.privateRepo,
        botTestingPR.org,
        {
          maxReviewers: 3,
          userBlacklist: [],
          fileBlacklist: [],
          requiredOrgs: [],
          numFilesToCheck: 5,
          findPotentialReviewers: true
        }
      ).then(function (owners) {
        expect(owners.indexOf('ghuser')).toEqual(-1);
      });
    });
  });

  it('ParseDiffEmpty', function() {
    expect(function() { mentionBot.parseDiff(''); }).not.toThrow();
  });

  it('ParseBlameEmpty', function() {
    expect(function() { mentionBot.parseBlame(''); }).not.toThrow();
  });

  it('ParseDiff3119', function() {
    var parsed = mentionBot.parseDiff(
      // https://github.com/facebook/react-native/pull/3119.diff
      getFile('3119.diff')
    );
    expect(parsed).toEqual([
      {
        path: 'Libraries/Components/MapView/MapView.js',
        deletedLines: [ 74 ],
        createdLines: [ 74, 84, 85, 86, 87, 88, 89, 90, 91 ]
      },
      {
        path: 'React/Views/RCTMap.m',
        deletedLines: [ 90, 92 ],
        createdLines: [ 90, 92, 93, 94 ]
      },
      {
        path: 'React/Views/RCTMapManager.m',
        deletedLines: [  ],
        createdLines: [ 40 ],
      },
    ]);
  });

  describe('When checking the size of PR 3229', ()=> {
    const largePR = {
      repoName: 'https://github.com/facebook/react-native',
      prNumber: 3229,
      prUser: 'mention-bot',
      prBaseBranch: 'master',
      privateRepo: false,
      org: 'facebook'
    }

    pit('returns the sum of createdLines and deletedLines', function() {
      mentionBot.enableCachingForDebugging = true;
      
      return mentionBot.prSize(
        largePR.repoName,
        largePR.prNumber
      ).then(function (prSize) {
        expect(prSize).toEqual(281);
      });
    });
  });

  it('ParseDiff35fa5', function() {
    var parsed = mentionBot.parseDiff(
      // https://github.com/facebook/react-native/commit/35fa5aa76233b3fbe541f3fa1756705900ee919c.diff
      getFile('35fa5aa76233b3fbe541f3fa1756705900ee919c.diff')
    );
    expect(parsed).toEqual([
      {
        path: 'website/src/react-native/img/TutorialFinal.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/TutorialMock.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/TutorialSingleFetched.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/TutorialStyledMock.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/chrome_breakpoint.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/favicon.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/header_logo.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
      {
        path: 'website/src/react-native/img/opengraph.png',
        deletedLines: [ ],
        createdLines: [ ]
      },
    ]);
  });

  function dumpCreatedLines(parsed) {
    parsed.forEach((entry)=> {
      console.log(entry.createdLines.join(", "));
    });
  }

  it('ParseDiff3229', function() {
    var parsed = mentionBot.parseDiff(
      // https://github.com/facebook/react-native/pull/3229.diff
      getFile('3229.diff')
    );

    expect(parsed).toEqual([
      {
        path: 'Libraries/WebSocket/WebSocket.ios.js',
        deletedLines: [ 19, 20, 21, 22, 23, 24, 25, 27, 28, 70, 74, 75, 77, 79, 83, 88, 89, 91, 95, 100, 101, 105, 109, 113, 114, 115, 116, 119 ],
        createdLines: [ 19, 21, 22, 23, 24, 70, 74, 75, 78, 82, 87, 89, 93, 98, 100, 103, 107, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 123 ]
      },
      {
        path: 'Libraries/WebSocket/WebSocketBase.js',
        deletedLines: [ 19, 25, 26, 27, 28, 29 ],
        createdLines: [ 19, 44, 45 ]
      },
      {
        path: 'Libraries/WebSocket/__mocks__/event-target-shim.js',
        deletedLines: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
        createdLines: [ ]
      },
      {
        path: 'Libraries/WebSocket/__tests__/Websocket-test.js',
        deletedLines: [ ],
        createdLines: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206 ]
      },
    ]);
  });

  it('ParseDiff1', function() {
    var parsed = mentionBot.parseDiff(
      // https://github.com/fbsamples/bot-testing/pull/1.diff
      getFile('1.diff')
    );
    expect(parsed).toEqual([
      {
        path: 'README.md',
        deletedLines: [  ],
        createdLines: [ 2 ]
      },
    ]);
  });

  describe('when checking the PR for common repo commits', () => {
    var githubMock = {
      pullRequests: {
        getCommits: (params,callback) => {
          var shas = {
            '1': [
              {sha:'04b928fd7f607f0d0b06c838f2d255494c8eaa03'}
            ],
            '2': [
              {sha:'b0f5444020a2885344eacbdcc86751074a6b735d'},
              {sha:'de2a15da302aad07fb246c2f5c4be85fbf2e65dd'},
              {sha:'e0b96f468f4a6318b68e37dcbb78a164b5474bf6'}
            ],
            '3': [
              {sha:'b0f5444020a2885344eacbdcc86751074a6b735d'},
              {sha:'de2a15da302aad07fb246c2f5c4be85fbf2e65dd'},
              {sha:'4ed70036758402ce7fde22878c4c56a9adae4c2c'}
            ]
          }
          callback(null, shas[params.number]);
        }
      }
    };

    pit('returns the matching commits if they exist', () => {
      return mentionBot.findCommonCommits(
        'mention-bot',
        'mention-bot',
        2,
        [1,2,3],
        githubMock
      ).then(function(commonCommits) {
        expect(commonCommits).toEqual([
          'b0f5444020a2885344eacbdcc86751074a6b735d',
          'de2a15da302aad07fb246c2f5c4be85fbf2e65dd'
        ]);
      });
    });

    pit('returns an empty list if non exist', () => {
      return mentionBot.findCommonCommits(
        'mention-bot',
        'mention-bot',
        1,
        [1,2,3],
        githubMock
      ).then(function(commonCommits) {
        expect(commonCommits).toEqual([]);
      });
    });
  });

  it('ParseBlame1', function() {
    var parsed = mentionBot.parseBlame(
      // https://github.com/facebook/react-native/blame/master/Libraries/Components/MapView/MapView.js
      getFile('MapView.js.blame')
    );

    expect(parsed).toEqual([
      'tadeuzagallo',
      'vjeux', 'vjeux', 'vjeux', 'vjeux', 'vjeux', 'vjeux',
      'tadeuzagallo', 'tadeuzagallo',
      'bhosmer',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'sahrens',
      'tadeuzagallo',
      'kmagiera',
      'tadeuzagallo', 'tadeuzagallo',
      'kmagiera',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'sahrens',
      'tadeuzagallo',
      'bhosmer',
      'philikon', 'philikon', 'philikon', 'philikon', 'philikon', 'philikon',
      'bhosmer',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'ultralame',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar',
      'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn',
      'ginamdar', 'ginamdar', 'ginamdar', 'ginamdar',
      'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn',
      'ginamdar', 'ginamdar', 'ginamdar',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'dvcrn', 'dvcrn',
      'ultralame',
      'dvcrn', 'dvcrn',
      'tadeuzagallo', 'tadeuzagallo',
      'bhosmer',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn', 'dvcrn',
      'tadeuzagallo',
      'dvcrn',
      'tadeuzagallo', 'tadeuzagallo', 'tadeuzagallo',
      'sahrens',
      'kmagiera',
      'sahrens',
      'kmagiera',
      'fkgozali',
      'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens', 'sahrens',
      'nicklockwood', 'nicklockwood', 'nicklockwood',
      'sahrens',
      'tadeuzagallo', 'tadeuzagallo',
    ]);
  });
});
