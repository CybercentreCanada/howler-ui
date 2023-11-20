import { joinParams } from 'api';
import assert from 'assert';

test('joinParams', () => {
  const uri = joinParams(
    '/a/b/c?test',
    new URLSearchParams([
      ['one', '1'],
      ['two', '2']
    ])
  );
  assert.strictEqual(uri, '/a/b/c?test&one=1&two=2');
});

test.only('extract route paramter', () => {
  // let route = '/test/one/:param';
  // let param = route.substring(route.lastIndexOf(':') + 1);
  // console.log(param);
  // route = '/test/one/two';
  // param = route.substring(route.lastIndexOf(':') + 1);
  // console.log(param);

  const regex = /^[^:]*:([^:]*)[^:]*$/;
  const match = regex.exec('/one/two/:three');
  console.log(match);

  //
  // console.log(regex.test('/one/two/:three'));
});
