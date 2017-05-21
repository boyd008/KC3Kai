(function () {
  'use strict';

  const Log = {};

  Log.saveToDb = (data) => {
    return KC3Database.loadIfNecessary().then(() => {
      // context will be overridden when invoked remotely
      return KC3Database.Log($.extend({ timestamp: Date.now(), context: 'Background' }, data));
    });
  };

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
