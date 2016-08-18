"use strict"

jest.dontMock('../environment.js');

describe('environment', () => {
  it('uses original config attributes if no env key is found', () => {
    let environment = require('../environment.js').environment;

    let parsedConfig = environment.checkEnvironmentForConfig({
      key:'fromDefaultConfig'
    })

    expect(parsedConfig).toEqual({
      key:'fromDefaultConfig'
    });
  })

  it('replaces the config attributes if an env key is found', () => {
    let environment = require('../environment.js').environment;

    process.env.A_KEY_NAME = 'fromEnv'

    let parsedConfig = environment.checkEnvironmentForConfig({
      aKeyName:'fromDefaultConfig'
    })

    expect(parsedConfig).toEqual({
      aKeyName:'fromEnv'
    });
  })

  it('only inserts underscores for every new word', () => {
    let environment = require('../environment.js').environment;

    process.env.A_KEY_NAME_ID = 'fromEnv'

    let parsedConfig = environment.checkEnvironmentForConfig({
      aKeyNameID:'fromDefaultConfig'
    })

    expect(parsedConfig).toEqual({
      aKeyNameID:'fromEnv'
    });
  })

  describe('when parsing the env variable', () => {
    afterEach(() => {
      process.env = {};
    });

    it('correctly parses an int', () => {
      let environment = require('../environment.js').environment;

      process.env.A_KEY_NAME = '100'

      let parsedConfig = environment.checkEnvironmentForConfig({
        aKeyName:10
      })

      expect(parsedConfig).toEqual({
        aKeyName:100
      });
    });

    it('correctly parses an array from a comma list', () => {
      let environment = require('../environment.js').environment;

      process.env.A_KEY_NAME = 'user1,user2'

      let parsedConfig = environment.checkEnvironmentForConfig({
        aKeyName:['user1']
      })

      expect(parsedConfig).toEqual({
        aKeyName:['user1','user2']
      });
    });

    it('skips parsing if the env variable is not set', () => {
      let environment = require('../environment.js').environment;

      let parsedConfig = environment.checkEnvironmentForConfig({
        aKeyName:['user1']
      })

      expect(parsedConfig).toEqual({
        aKeyName:['user1']
      });
    });

    it('correctly trims whitespace from a comma list', () => {
      let environment = require('../environment.js').environment;

      process.env.A_KEY_NAME = 'user1, user2'

      let parsedConfig = environment.checkEnvironmentForConfig({
        aKeyName:['user1']
      })

      expect(parsedConfig).toEqual({
        aKeyName:['user1','user2']
      });
    });

    it('correctly interperts boolean values', () => {
      let environment = require('../environment.js').environment;

      process.env.A_KEY_NAME = 'true';
      process.env.B_KEY_NAME = 'TRUE';
      process.env.C_KEY_NAME = 'false';

      let parsedConfig = environment.checkEnvironmentForConfig({
        aKeyName:false,
        bKeyName:false,
        cKeyName:true
      })

      expect(parsedConfig).toEqual({
        aKeyName:true,
        bKeyName:true,
        cKeyName:false
      });
    });

    it('correctly interperts the current config', () => {
      let environment = require('../environment.js').environment;

      process.env.MAX_REVIEWERS = '4';
      process.env.NUM_FILES_TO_CHECK = '6';
      process.env.USER_BLACKLIST = 'user1';
      process.env.USER_BLACKLIST_FOR_PR = 'user1,user2';
      process.env.USER_WHITELIST = 'user3';
      process.env.FILE_BLACKLIST = '**.md';
      process.env.REQUIRED_ORGS = 'facebook';
      process.env.FIND_POTENTIAL_REVIEWERS = 'false';
      process.env.ACTIONS = 'opened,closed';
      process.env.SKIP_ALREADY_ASSIGNED_PR = 'true';
      process.env.SKIP_ALREADY_MENTIONED_PR = 'true';
      process.env.DELAYED = 'true';
      process.env.DELAYED_UNTIL = '1d';
      process.env.ASSIGN_TO_REVIEWER = 'true';
      process.env.SKIP_TITLE = 'skippy';
      process.env.WITH_LABEL = 'labelly';
      process.env.SKIP_COLLABORATOR_PR = 'true';

      let parsedConfig = environment.checkEnvironmentForConfig({
        maxReviewers: 3,
        numFilesToCheck: 5,
        userBlacklist: [],
        userBlacklistForPR: [],
        userWhitelist: [],
        fileBlacklist: [],
        requiredOrgs: [],
        findPotentialReviewers: true,
        actions: ['opened'],
        skipAlreadyAssignedPR: false,
        skipAlreadyMentionedPR: false,
        delayed: false,
        delayedUntil: '3d',
        assignToReviewer: false,
        skipTitle: '',
        withLabel: '',
        skipCollaboratorPR: false,
      })

      expect(parsedConfig).toEqual({
        maxReviewers: 4,
        numFilesToCheck: 6,
        userBlacklist: ['user1'],
        userBlacklistForPR: ['user1','user2'],
        userWhitelist: ['user3'],
        fileBlacklist: ['**.md'],
        requiredOrgs: ['facebook'],
        findPotentialReviewers: false,
        actions: ['opened','closed'],
        skipAlreadyAssignedPR: true,
        skipAlreadyMentionedPR: true,
        delayed: true,
        delayedUntil: '1d',
        assignToReviewer: true,
        skipTitle: 'skippy',
        withLabel: 'labelly',
        skipCollaboratorPR: true,
      });
    });
  });
});
