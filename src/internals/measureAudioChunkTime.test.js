import {expect} from 'chai';
// import sinon from 'sinon';
// import {marbles} from 'rxjs-marbles/mocha';

import measureAudioChunkTime from './measureAudioChunkTime';

describe('measureAudioChunkTime', () => {
  it('should export a function', () => {
    expect(measureAudioChunkTime).to.be.a('function');
  });

  it('should properly calculate time based on buffer size', () => {
    const fakeBuffer = {length: 32000};
    const result = measureAudioChunkTime()(fakeBuffer);
    expect(result).to.equal(1);
  });
});
