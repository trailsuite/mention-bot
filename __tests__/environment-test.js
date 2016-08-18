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
  });
});
