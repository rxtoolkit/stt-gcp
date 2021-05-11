import {expect} from 'chai';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';

import toGCP, {testExports} from './toGCP';
const {parseEncoding} = testExports;

// Not much point in writing tests for this, since they'd basically just be
// integration tests
describe('toGCP', () => {
  it('should export a function', marbles(m => {
    expect(toGCP).to.be.a('function');
  }));

  it('should parseEncoding properly', () => {
    const codec = parseEncoding('audio/l16');
    expect(codec).to.deep.equal('LINEAR16');
  });
});
