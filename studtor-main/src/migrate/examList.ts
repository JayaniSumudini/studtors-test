import { DetailTypes } from '../constant/tableNames';

export default [
  {
    id: '1_exam',
    examName: 'Cambridge GCE A-Level',
    subjectIds: [
      '1_subject',
      '3_subject',
      '6_subject',
      '7_subject',
      '10_subject',
      '15_subject',
      '18_subject',
      '21_subject',
      '28_subject',
      '29_subject',
      '36_subject',
      '41_subject',
    ],
    grades: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/1_exam.png',
    colorCode: '#FD8282',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '2_exam',
    examName: 'Cambridge IGCSE',
    subjectIds: [
      '1_subject',
      '2_subject',
      '3_subject',
      '6_subject',
      '7_subject',
      '10_subject',
      '15_subject',
      '18_subject',
      '21_subject',
      '29_subject',
      '32_subject',
      '35_subject',
      '36_subject',
      '41_subject',
    ],
    grades: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/2_exam.png',
    colorCode: '#FFCF5C',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '3_exam',
    examName: 'Edexcel GCE A-Levels',
    subjectIds: [
      '3_subject',
      '6_subject',
      '7_subject',
      '15_subject',
      '18_subject',
      '21_subject',
      '28_subject',
      '29_subject',
      '36_subject',
      '41_subject',
    ],
    grades: ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/3_exam.png',
    colorCode: '#FD8282',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '4_exam',
    examName: 'Edexcel IGCSE',
    subjectIds: [
      '1_subject',
      '3_subject',
      '6_subject',
      '7_subject',
      '15_subject',
      '18_subject',
      '21_subject',
      '29_subject',
      '36_subject',
      '41_subject',
    ],
    grades: ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/4_exam.png',
    colorCode: '#FFCF5C',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '5_exam',
    examName: 'International Baccalaureate (IB)',
    subjectIds: [
      '4_subject',
      '5_subject',
      '8_subject',
      '9_subject',
      '11_subject',
      '12_subject',
      '13_subject',
      '14_subject',
      '16_subject',
      '17_subject',
      '19_subject',
      '20_subject',
      '22_subject',
      '23_subject',
      '24_subject',
      '25_subject',
      '26_subject',
      '27_subject',
      '30_subject',
      '31_subject',
      '33_subject',
      '34_subject',
      '37_subject',
      '38_subject',
      '39_subject',
      '40_subject',
      '42_subject',
      '43_subject',
    ],
    grades: ['7', '6', '5', '4', '3', '2', '1'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/5_exam.png',
    colorCode: '#0076FF',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '6_exam',
    examName: 'OxfordAQA IGCSE',
    subjectIds: [
      '3_subject',
      '6_subject',
      '7_subject',
      '18_subject',
      '21_subject',
      '29_subject',
      '36_subject',
      '41_subject',
    ],
    grades: ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/6_exam.png',
    colorCode: '#FFCF5C',
    detailType: DetailTypes.EXAM.toString(),
  },
  {
    id: '7_exam',
    examName: 'OxfordAQA International AS/A-Levels',
    subjectIds: [
      '3_subject',
      '6_subject',
      '7_subject',
      '18_subject',
      '21_subject',
      '28_subject',
      '29_subject',
      '36_subject',
      '41_subject',
      '44_subject',
    ],
    grades: ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'U'],
    imageUrl: 'https://studtors-assets.s3.amazonaws.com/exam-images/7_exam.png',
    colorCode: '#FD8282',
    detailType: DetailTypes.EXAM.toString(),
  },
];
