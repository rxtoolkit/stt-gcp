import {expect} from 'chai';
import sinon from 'sinon';
import {marbles} from 'rxjs-marbles/mocha';
import {mapTo} from 'rxjs/operators';

import base64WithTimingToSTT from './base64WithTimingToSTT';
import mapGCPResponseToCleanOutput from './mapGCPResponseToCleanOutput';

const fakeResponse = [{
    results: [
      {
        alternatives: [
          {
            words: [
              {
                startTime: {
                  seconds: '0',
                  nanos: 0,
                },
                endTime: {
                  seconds: '0',
                  nanos: 800000000,
                },
                word: 'soldiers',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '0',
                  nanos: 900000000,
                },
                endTime: {
                  seconds: '1',
                  nanos: 400000000,
                },
                word: 'Sailors',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '1',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '1',
                  nanos: 600000000,
                },
                word: 'and',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '1',
                  nanos: 600000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 200000000,
                },
                word: 'Airmen',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 200000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 400000000,
                },
                word: 'of',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 500000000,
                },
                word: 'the',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 500000000,
                },
                endTime: {
                  seconds: '2',
                  nanos: 900000000,
                },
                word: 'Allied',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '2',
                  nanos: 900000000,
                },
                endTime: {
                  seconds: '3',
                  nanos: 700000000,
                },
                word: 'expeditionary',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '3',
                  nanos: 700000000,
                },
                endTime: {
                  seconds: '4',
                  nanos: 100000000,
                },
                word: 'Force',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
            ],
            transcript: 'soldiers Sailors and Airmen of the Allied expeditionary Force',
            confidence: 0.862013578414917,
          },
        ],
        channelTag: 0,
        languageCode: 'en-us',
      },
    ],
  },
];

describe('base64WithTimingToSTT', () => {
  it('should export a function', () => {
    expect(base64WithTimingToSTT).to.be.a('function');
  });

  it('should return properly timestamped STT responses, given an input stream', marbles(m => {
    const fakeResponses = source$ => source$.pipe(mapTo(fakeResponse));
    const _toSTT = sinon.stub().returns(fakeResponses);
    const fakeEvents = [
      ['foo0', [256, 260]],
      ['foo1', [260, 265]],
      ['foo2', [265, 270]],
      ['foo3', [270, 275]],
    ];
    const source$ = m.cold('-0-1-2--3|', fakeEvents);
    const operator = base64WithTimingToSTT({
      gcpConfig: {},
      useInterimResults: false,
      singleUtterance: false,
      useBetaModel: true,
      _toSTT,
    });
    const out$ = source$.pipe(operator);
    const expected$ = m.cold('-0-1-2--3|', [
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
      mapGCPResponseToCleanOutput(256)(fakeResponse),
    ]);
    m.expect(out$).toBeObservable(expected$);
  }));
});
