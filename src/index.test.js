import {expect} from 'chai';
// import sinon from 'sinon';
// import {marbles} from 'rxjs-marbles/mocha';

import {toGCPSpeech} from './index';

describe('index', () => {
  it('should export a function', () => {
    expect(toGCPSpeech).to.be.a('function');
  });
});
