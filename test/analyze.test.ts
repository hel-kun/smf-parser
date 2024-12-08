import { analyze } from '@/analyze';
import { parse } from '@/parse';
import { SmfBinary, smfData } from '@/types';

type analyzeTestCase = {
  input: SmfBinary,
  output: smfData,
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
          tracks: {
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
          tracks: {
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
          tracks: {
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
          tracks: {
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
          tracks: {
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
          tracks: {
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

(async () => {
  const testCases = await loadTestCases();
})();