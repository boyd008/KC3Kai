(function () {
  'use strict';

  const Log = {
    context: 'Unknown context',
  };

  const DUMMY_ERROR_MSG = '{DummyError}';

  // ----------------------------------------------------------------------- //
  // ---------------------------[ PUBLIC API ]------------------------------ //
  // ----------------------------------------------------------------------- //

  Log.error = (stack, ...data) => {
    return Promise.resolve({ stack, data })
      .then(KC3Log.lookupErrorObject)
      .then(KC3Log.composeError)
      .then(KC3Log.saveToDb)
      .catch((err) => {
        KC3Log.printError(err);
        throw err;
      });
  };

  Log.assert = (stack, assertion, message, ...data) => {
    return Promise.resolve({ stack, assertion, message, data })
      .then(KC3Log.checkAssertion)
      .then(KC3Log.composeError)
      .then(KC3Log.saveToDb)
      .catch((err) => {
        if (err instanceof Error) {
          KC3Log.printError(err);
          throw err;
        }
      });
  };

  Log.warn = (stack, message, ...data) => { return KC3Log.logMessage('warn', stack, message, data); };
  Log.log = (stack, message, ...data) => { return KC3Log.logMessage('log', stack, message, data); };
  Log.info = (stack, message, ...data) => { return KC3Log.logMessage('info', stack, message, data); };
  // console.debug() is an alias for console.log()
  Log.debug = (stack, message, ...data) => { return KC3Log.logMessage('log', stack, message, data); };

  // ----------------------------------------------------------------------- //
  // ------------------------[ INTERNAL METHODS ]--------------------------- //
  // ----------------------------------------------------------------------- //

  Log.printError = (error) => {
    console.error(error, error.stack); /* RemoveLogging: skip */
  };

  Log.logMessage = (logLevel, stack, message, data) => {
    return Promise.resolve({ type: logLevel, message })
      .then(result => {
        const mergedResult = $.extend({
          data: KC3Log.stringifyRestParams(data),
          source: KC3Log.extractStackLineNumber(stack)
        }, result);
        // also attach stack for warn level
        if (logLevel === 'warn') {
          mergedResult.stack = KC3Log.replaceStackMessage(stack, String(message));
        }
        return mergedResult;
      })
      .then(KC3Log.saveToDb)
      .catch((err) => {
        KC3Log.printError(err);
        throw err;
      });
  };

  Log.stringifyRestParams = (params) => {
    return params.map((d) => {
      if (d instanceof Error) {
        return String(d);
      }
      if (typeof d === 'object') {
        return JSON.stringify(d);
      }
      return String(d);
    });
  };

  // ------------------------------[ ERROR ]-------------------------------- //

  Log.lookupErrorObject = ({ stack, data }) => {
    const errors = data.filter(o => o instanceof Error);
    return { stack, error: errors[0], data };
  };

  Log.checkAssertion = ({ stack, assertion, message, data }) => {
    return !!assertion ? Promise.reject('Assertion passed') :
      { stack, error: 'Assertion failed: ' + message, data };
  };

  Log.composeError = ({ stack, error, data }) => {
    const result = { type: 'error', data: KC3Log.stringifyRestParams(data),
      source: KC3Log.extractStackLineNumber(stack) };
    if (error === undefined) {
      // if no Error object found, take 1st data object as error message
      error = data[0] || 'Unknown Error';
    }
    if (error instanceof Error) {
      // Error object found, but still try 1st data object as log message
      return $.extend(result, { message: String(data[0] || error), stack: error.stack,
        source: KC3Log.extractStackLineNumber(error.stack) });
    }
    // if other types are thrown
    return $.extend(result,
      { message: String(error), stack: KC3Log.replaceStackMessage(stack, String(error)) });
  };

  Log.generateStackTrace = (message) => {
    // alternatively can use non-standard `Error.captureStackTrace(obj, thisFunc)`
    const stack = (new Error(message)).stack;
    // remove functions from this file from the stack
    const lines = stack.split(/\r?\n/);
    return lines.filter(line => line.indexOf('modules/Log/Log.js') === -1).join('\n');
  };

  Log.replaceStackMessage = (stack, message) => {
    if (stack.indexOf(DUMMY_ERROR_MSG) > -1) {
      // replace first line with specified message
      const lines = stack.split(/\r?\n/);
      lines[0] = message;
      return lines.join('\n');
    }
    return stack;
  };

  Log.extractStackLineNumber = (stack) => {
    if (!stack) {
      return '?';
    }
    const line = stack.split(/\r?\n/)[1];
    return !line ? '?' : (line.indexOf(' (') > -1
          ? line.split(' (')[1].trimRight().slice(0, -1)
          : line.split('at ')[1]
    );
  };

  // ---------------------------[ GLOBAL INIT ]----------------------------- //

  // Override console methods
  ['assert', 'error', 'warn', 'log', 'info'].forEach((methodName) => {
    const oldMethod = console[methodName].bind(console);
    console[methodName] = (...args) => {
      KC3Log[methodName](KC3Log.generateStackTrace(DUMMY_ERROR_MSG), ...args);
      oldMethod(...args);
    };
  });

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
