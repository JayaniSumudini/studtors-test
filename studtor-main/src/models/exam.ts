import { SubjectTypes } from '../constant/subjectTypes';

export interface Syllabus {
  id: string;
  examName: string;
  subjectIds: string[];
  grades: string[];
  imageUrl: string;
  colorCode: string;
}

export interface Subject {
  id: string;
  subjectName: string;
  grade: string;
  subjectType: SubjectTypes;
  imageUrl: string;
}

export interface ExamResponse {
  id: string;
  examName: string;
  subjects: Subject[];
  grades: string[];
  imageUrl: string;
  colorCode: string;
}

export interface ExamResult {
  examId: string;
  examName?: string;
  subjectResults: SubjectResult[];
}

export interface SubjectResult {
  subjectId: string;
  subjectName?: string;
  grade: string;
}

export interface PreferredSyllabusAndSubjects {
  syllabusId: string;
  subjectIds: string[];
}

export interface PreferredSyllabusAndSubjectsResponse {
  syllabusId: string;
  syllabusName: string;
  subjects: Subject[];
}
