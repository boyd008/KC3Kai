
QUnit.module('pages > strategy > tabs > logger', function () {
  const logger = KC3StrategyTabs.logger.definition;

  QUnit.module('getVisibleEntryTypes', {
    beforeEach() { this.subject = logger.getVisibleEntryTypes; },
  }, function () {
    QUnit.test('return as array', function (assert) {
      logger.visibleLogTypes = { info: false, log: false, warn: true, error: true };

      const result = this.subject();

      assert.notOk(result.includes('info'));
      assert.notOk(result.includes('log'));
      assert.ok(result.includes('warn'));
      assert.ok(result.includes('error'));
    });
  });

  QUnit.module('isDateSplit', {
    beforeEach() { this.subject = logger.isDateSplit; },
  }, function () {
    QUnit.test('true if specified times are on different days', function (assert) {
      const result = this.subject({ timestamp: new Date(2017, 1, 1).getTime() },
        { timestamp: new Date(2017, 1, 2).getTime() });

      assert.equal(result, true);
    });

    QUnit.test('false if specified times are on the same day', function (assert) {
      const result = this.subject({ timestamp: new Date(2017, 1, 1, 5) },
        { timestamp: new Date(2017, 1, 1, 20) });

      assert.equal(result, false);
    });
  });

  QUnit.module('createDateSeparator', {
    beforeEach() { this.subject = logger.createDateSeparator; },
  }, function () {
    QUnit.test('success', function (assert) {
      const entry = { timestamp: new Date().getTime() };

      const result = this.subject(entry);

      assert.deepEqual(result, {
        type: 'dateSeparator',
        timestamp: entry.timestamp,
      });
    });
  });

  QUnit.module('elementFactory > error > formatTimestamp', {
    beforeEach() { this.subject = logger.formatTimestamp; },
  }, function () {
    QUnit.test('transform to string', function (assert) {
      const timestamp = new Date(2017, 1, 1, 14, 7, 25).getTime();

      const result = this.subject(timestamp);

      assert.equal(result, '14:07:25');
    });
  });

  QUnit.module('elementFactory > error > formatStack', {
    beforeEach() { this.subject = logger.elementFactory.error.formatStack; },
  }, function () {
    QUnit.test('replace chrome extension id', function (assert) {
      const stack = `at loadLogEntries (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:56:18)
at Object.execute (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:30:21)
at chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:80:21
at Object.success (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:40:6)
at i (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27151)
at Object.fireWith [as resolveWith] (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27914)
at z (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:12059)
at XMLHttpRequest.<anonymous> (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:15619)`;

      const result = this.subject(stack);

      assert.equal(result, `at loadLogEntries (src/pages/strategy/tabs/logger/logger.js:56:18)
at Object.execute (src/pages/strategy/tabs/logger/logger.js:30:21)
at src/library/objects/StrategyTab.js:80:21
at Object.success (src/library/objects/StrategyTab.js:40:6)
at i (src/assets/js/jquery.min.js:2:27151)
at Object.fireWith [as resolveWith] (src/assets/js/jquery.min.js:2:27914)
at z (src/assets/js/jquery.min.js:4:12059)
at XMLHttpRequest.<anonymous> (src/assets/js/jquery.min.js:4:15619)`);
    });
  });

  QUnit.module('elementFactory > dateSeparator > formatDate', {
    beforeEach() { this.subject = logger.elementFactory.dateSeparator.formatDate; },
  }, function () {
    QUnit.test('return as iso date string', function (assert) {
      const timestamp = new Date(2017, 0, 1).getTime();

      const result = this.subject(timestamp);

      assert.equal(result, '2017-01-01');
    });
  });
});
