(function () {
  'use strict';

  const Log = {
    context: 'Unknown context',
  };

  // ----------------------------------------------------------------------- //
  // ---------------------------[ PUBLIC API ]------------------------------ //
  // ----------------------------------------------------------------------- //

  Log.error = (error, ...data) => {
    return Promise.resolve({ error, data })
      .then(KC3Log.composeError)
      .then(KC3Log.saveToDb)
      .catch((err) => {
        KC3Log.printError(err);
        throw err;
      });
  };

  Log.warn = (message, ...data) => { return KC3Log.logMessage('warn', message, data); };
  Log.log = (message, ...data) => { return KC3Log.logMessage('log', message, data); };
  Log.info = (message, ...data) => { return KC3Log.logMessage('info', message, data); };
  // console.debug() is an alias for console.log()
  Log.debug = (message, ...data) => { return KC3Log.logMessage('log', message, data); };

  // ----------------------------------------------------------------------- //
  // ------------------------[ INTERNAL METHODS ]--------------------------- //
  // ----------------------------------------------------------------------- //

  Log.printError = (error) => {
    console.error(error, error.stack); /* RemoveLogging: skip */
  };

  Log.logMessage = (logLevel, message, data) => {
    return Promise.resolve({ type: logLevel, message })
      .then(result => $.extend({ data: KC3Log.stringifyRestParams(data) }, result))
      .then(KC3Log.saveToDb)
      .catch((err) => {
        KC3Log.printError(err);
        throw err;
      });
  };

  Log.stringifyRestParams = (params) => {
    return params.map((d) => {
      if (typeof d === 'object') {
        return JSON.stringify(d);
      }
      return d.toString();
    });
  };

  // ------------------------------[ ERROR ]-------------------------------- //

  Log.composeError = ({ error, data }) => {
    const result = { type: 'error', data: KC3Log.stringifyRestParams(data) };
    if (typeof error === 'string') {
      return $.extend(result,
        { message: error, stack: KC3Log.generateStackTrace(error) });
    }
    return $.extend(result, { message: error.message, stack: error.stack });
  };

  Log.generateStackTrace = (message) => {
    const stack = (new Error(message)).stack;

    // remove functions from this file from the stack
    const lines = stack.split(/\r?\n/);
    lines.splice(1, 2);

    return lines.join('\n');
  };

  // ---------------------------[ GLOBAL INIT ]----------------------------- //

  // Override console methods
  ['error', 'warn', 'log', 'debug', 'info'].forEach((methodName) => {
    const oldMethod = console[methodName].bind(console);
    console[methodName] = (...args) => {
      KC3Log[methodName](...args);
      oldMethod(...args);
    };
  });

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
