import {expect} from 'chai';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';

import toGCP from './toGCP';

// Not much point in writing tests for this, since they'd basically just be
// integration tests
describe('toGCP', () => {
  it('should export a function', marbles(m => {
    expect(toGCP).to.be.a('function');
  }));
});
