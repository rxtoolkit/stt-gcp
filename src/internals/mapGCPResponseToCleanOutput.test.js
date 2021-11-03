import get from 'lodash/get';
import {expect} from 'chai';
// import sinon from 'sinon';
// import {marbles} from 'rxjs-marbles/mocha';

import
  mapGCPResponseToCleanOutput,
  {
    getGCPTimestampObject,
    mapAlternative,
    mapResult,
    mapWord
  } from './mapGCPResponseToCleanOutput';

const gcpEvent = [
  {
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
  {
    results: [
      {
        alternatives: [
          {
            words: [
              {
                startTime: {
                  seconds: '5',
                  nanos: 0,
                },
                endTime: {
                  seconds: '5',
                  nanos: 400000000,
                },
                word: 'You',
                confidence: 0.7075783014297485,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 400000000,
                },
                endTime: {
                  seconds: '5',
                  nanos: 600000000,
                },
                word: 'are',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 600000000,
                },
                endTime: {
                  seconds: '5',
                  nanos: 800000000,
                },
                word: 'about',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
              {
                startTime: {
                  seconds: '5',
                  nanos: 800000000,
                },
                endTime: {
                  seconds: '6',
                  nanos: 0,
                },
                word: 'to.',
                confidence: 0.9128385782241821,
                speakerTag: 0,
              },
            ],
            transcript: ' You are about to.',
            confidence: 0.8615235090255737,
          },
        ],
        channelTag: 0,
        languageCode: 'en-us',
      },
    ]
  },
];

describe('mapGCPResponseToCleanOutput', () => {
  it('should export a function', () => {
    expect(mapGCPResponseToCleanOutput).to.be.a('function');
  });

  it('should format timestamps correctly for basic case', () => {
    const startSeconds = 550.6;
    const word = {startTime: {seconds: '25', nanos: 500000000}};
    const {nanos, seconds} = getGCPTimestampObject(word.startTime, startSeconds);
    expect(seconds).to.equal('576');
    expect(nanos).to.equal(100000000);
  });

  it('.mapWord should calculate timestamps correctly for basic case', () => {
    const startTime = 100;
    const word = {
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
    };
    const cleanWord = mapWord(startTime)(word);
    const expected = {
      ...word,
      startTime: {seconds: '100', nanos: 0},
      endTime: {seconds: '100', nanos: 800000000},
    };
    expect(cleanWord).to.deep.include(expected);
  });

  it('.mapAlternative should map the alternative correctly for basic case', () => {
    const startTime = 100;
    const fakeAlternative = {
      words: [{
        startTime: {seconds: '0', nanos: 100},
        endTime: {seconds: '0', nanos: 200},
      }],
      transcript: 'soldiers Sailors and Airmen of the Allied expeditionary Force',
      confidence: 0.862013578414917,
    };
    const result = mapAlternative(startTime)(fakeAlternative);
    const expected = {
      ...fakeAlternative,
      words: [{
        startTime: {seconds: '100', nanos: 100},
        endTime: {seconds: '100', nanos: 200},
      }],
    };
    expect(result).to.deep.equal(expected)
  });

  it('.mapResult should map a result correctly for the basic case', () => {
    const startTime = 100;
    const fakeResult = {
      channelTag: 0,
      languageCode: 'en-us',
      alternatives: [{
        transcript: 'soldiers Sailors and Airmen of the Allied expeditionary Force',
        confidence: 0.862013578414917,
        words: [{
          startTime: {seconds: '0', nanos: 100},
          endTime: {seconds: '0', nanos: 200},
        }],
      }],
    };
    const result = mapResult(startTime)(fakeResult);
    const expected = {
      channelTag: 0,
      languageCode: 'en-us',
      alternatives: [{
        transcript: 'soldiers Sailors and Airmen of the Allied expeditionary Force',
        confidence: 0.862013578414917,
        words: [{
          startTime: {seconds: '100', nanos: 100},
          endTime: {seconds: '100', nanos: 200},
        }],
      }],
    };
    expect(result).to.deep.equal(expected);
  });

  it('should add starting time offset to word timestamps', () => {
    const startTime = 100.5;
    const response = mapGCPResponseToCleanOutput(startTime)(gcpEvent);
    // {
    //   startTime: {
    //     seconds: '0',
    //     nanos: 900000000,
    //   },
    //   endTime: {
    //     seconds: '1',
    //     nanos: 400000000,
    //   },
    //   word: 'Sailors',
    //   confidence: 0.9128385782241821,
    //   speakerTag: 0,
    // },
    const expected = {
      startTime: {
        seconds: '101',
        nanos: 400000000,
      },
      endTime: {
        seconds: '101',
        nanos: 900000000,
      },
      word: 'Sailors',
      confidence: 0.9128385782241821,
      speakerTag: 0,
    };
    const result = get(response, 'results[0].alternatives[0].words[1]');
    expect(result).to.deep.equal(expected);
  });
});

