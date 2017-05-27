(function () {
  'use strict';

  const MS_PER_HOUR = 1000 * 60 * 60;

  const Log = {};

  Log.saveToDb = (data) => {
    return KC3Database.loadIfNecessary().then(() => {
      return KC3Database.Log(KC3Log.composeData(data), {
        expireAt: KC3Log.getExpiryTimestamp(),
      });
    });
  };

  Log.getExpiryTimestamp = () => {
    ConfigManager.loadIfNecessary();
    return Date.now() - (ConfigManager.hoursToKeepLogs * MS_PER_HOUR);
  };

  Log.composeData = (data) => {
    // context prop will be overridden when invoked remotely
    return $.extend({ timestamp: Date.now(), context: 'Background' }, data);
  };

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
