import { analyze } from '@/analyze';
import { parse } from '@/parse';
import { SmfBinary, SmfData } from '@/types';
import { test, expect } from '@jest/globals';

type analyzeTestCase = {
  input: SmfBinary,
  output: SmfData,
};

// テストケース
// headerの解析
// track内のmetadataの解析
// track内のnoteの解析(これは多分コードもテストケースも書くのが大変なので、TDDに反しているとは思いつつも後回しにする)
const loadTestCases = async () => {
  const testCases: {header:analyzeTestCase[], metadata: analyzeTestCase[]} = {
    header: [
      {
        input: await parse(new File(['../test/smfFile/4536.mid'], '../test/smfFile/4536.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/c.mid'], '../test/smfFile/c.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/wagamachi.mid'], '../test/smfFile/wagamachi.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [],
            beats: [],
            notes: [],
          }
        }
      },
    ],
    metadata: [
      {
        input: await parse(new File(['../test/smfFile/4536.mid'], '../test/smfFile/4536.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [
              {bpm: 120, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/c.mid'], '../test/smfFile/c.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [
              {bpm: 120, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
      {
        input: await parse(new File(['../test/smfFile/wagamachi.mid'], '../test/smfFile/wagamachi.mid')),
        output: {
          header: {
            format: 1,
            tracks: 2,
            division: 480,
          },
          track: {
            tempos: [
              {bpm: 110.00011000011, timing: 0}
            ],
            beats: [
              {beat_denominator: 4, beat_numerator: 4, timing: 0}
            ],
            notes: [],
          }
        }
      },
    ],
  };
  return testCases;
};

let testCases: {header: analyzeTestCase[], metadata: analyzeTestCase[]};

beforeAll(async () => {
  testCases = await loadTestCases();
});

test('analyze metadata 4536.mid', () => {
  const testCase = testCases.metadata[0];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});

test('analyze metadata c.mid', () => {
  const testCase = testCases.metadata[1];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});

test('analyze metadata wagamachi.mid', () => {
  const testCase = testCases.metadata[2];
  const result = analyze(testCase.input);
  expect(result).toEqual(testCase.output);
});