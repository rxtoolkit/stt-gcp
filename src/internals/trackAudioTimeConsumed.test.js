import {expect} from 'chai';
// import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';

import trackAudioTimeConsumed from './trackAudioTimeConsumed';

describe('trackAudioTimeConsumed', () => {
  it('should export a function', () => {
    expect(trackAudioTimeConsumed).to.be.a('function');
  });

  it('should track the amount of audio time consumed', marbles(m => {
    const source = [
      {length: 32000}, // 1 sec
      {length: 64000}, // 2 sec
      {length: 512000}, // 16 sec
      {length: 256000}, // 8 sec
    ];
    const source$ = m.cold('-01(23|)', source);
    const expected$ = m.cold('-01(23|)', [1, 3, 19, 27]);
    const result$ = source$.pipe(trackAudioTimeConsumed());
    m.expect(result$).toBeObservable(expected$);
  }));
});
