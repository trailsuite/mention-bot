"use strict"

function checkEnvironmentForConfig(config:Object) : Object {
  return Object.keys(config).reduce((previousValue, key) => {
    let defaultConfigValue = config[key];
    let environmentVariable = getEnvironmentValueForObjectKey(key,
      defaultConfigValue);
    let configElement = {};
    configElement[key] = environmentVariable === undefined ? defaultConfigValue
      : environmentVariable;

    return {...previousValue, ...configElement};
  }, {});
}

function getEnvironmentValueForObjectKey(key:string, originalValue:Object) {
  let envKeyName = key.replace(/([A-Z]+?[^a-z]|[A-Z])/g,
    (match) => `_${match}`).toUpperCase();

  let rawValue = process.env[envKeyName];

  if(rawValue === undefined) {
    return;
  }

  switch(typeof originalValue) {
    case "string":
      return rawValue;
    case "number":
      return Number.parseInt(rawValue);
    case "boolean":
      return rawValue.toString().toLowerCase() === 'true';
    case "object":
      if( Array.isArray(originalValue) ) {
        return rawValue.split(",").map((item)=>item.trim())
      } else {
        return rawValue;
      }
  }
}

exports.environment = {
  checkEnvironmentForConfig
}
