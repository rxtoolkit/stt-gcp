import path from 'path';
import {expect} from 'chai';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';
import {map} from 'rxjs/operators'

import {fromFile} from '@bottlenose/rxfs';

import trackAudioTimeConsumed from './trackAudioTimeConsumed';

const SAMPLE_FILE_PATH = path.resolve(
  __dirname,
  '../../scripts/sample-audio.linear16'
);

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

  it('should correctly time the real audio sample file', done => {
    const onData = sinon.spy();
    const source$ = fromFile({filePath: SAMPLE_FILE_PATH});
    const out$ = source$.pipe(
      trackAudioTimeConsumed()
    );
    const actualAudioTime = 98.97800000000008;
    out$.subscribe(onData, console.trace, () => {
      expect(onData.getCall(onData.callCount - 1).args[0]).to.equal(actualAudioTime);
      done();
    });
  }).timeout(3000);
});
