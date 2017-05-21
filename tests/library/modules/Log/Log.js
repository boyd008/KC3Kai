QUnit.module('modules > Log', function () {
  QUnit.module('stringifyRestParams', {
    beforeEach() { this.subject = KC3Log.stringifyRestParams; },
  }, function () {
    QUnit.test('use stringify for objects', function (assert) {
      const obj = { test: 1 };

      const result = this.subject([obj]);

      assert.equal(result, JSON.stringify(obj));
    });

    QUnit.test('convert params to string', function (assert) {
      const string = 'test';
      const num = 1;

      const result = this.subject([string, num]);

      assert.deepEqual(result, ['test', '1']);
    });
  });
});
