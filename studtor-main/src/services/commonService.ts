import { injectable, inject } from 'inversify';
import { CustomResponseBuilder, CustomResponse } from '../dependency/customResponse';
import { DynamoDbAdapterImpl } from '../dependency/database/dynamoDb/dynamoDbAdapterImpl';
import { TableTypes, DetailTypes } from '../constant/tableNames';
import { University } from '../models/university';
import { Nationality } from '../models/nationality';
import { Language } from '../models/language';
import { District } from '../models/location';
import { Syllabus, Subject, ExamResponse } from '../models/exam';
import { DbParam } from '../models/dbParam';
import { ItemResponseList } from 'aws-sdk/clients/dynamodb';

@injectable()
export class CommonService {
  private db: DynamoDbAdapterImpl;

  constructor(@inject(DynamoDbAdapterImpl) dbAdapter: DynamoDbAdapterImpl) {
    this.db = dbAdapter;
  }

  public async getUniversityList(): Promise<CustomResponse> {
    return await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.UNIVERSITY, 'universityName')
      .then((universityList: University[]) =>
        new CustomResponseBuilder()
          .status(200)
          .message('Get University List Success')
          .data(universityList.sort(this.sortByProperty('universityName')))
          .build(),
      )
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('University List Not Exists').build(),
      );
  }

  public async getNationalityList(): Promise<CustomResponse> {
    return await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.NATIONALITY, 'nationality')
      .then((nationalityList: Nationality[]) =>
        new CustomResponseBuilder()
          .status(200)
          .message('Get Nationality List Success')
          .data(nationalityList.sort(this.sortByProperty('nationality')))
          .build(),
      )
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Nationality List Not Exists').build(),
      );
  }

  public async getLanguagesList(): Promise<CustomResponse> {
    return await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.LANGUAGE, 'languageName')
      .then((languageList: Language[]) =>
        new CustomResponseBuilder()
          .status(200)
          .message('Get Language List Success')
          .data(languageList.sort(this.sortByProperty('languageName')))
          .build(),
      )
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Language List Not Exists').build(),
      );
  }

  public async getDistrictList(): Promise<CustomResponse> {
    return await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.DISTRICT, 'district')
      .then((districtList: District[]) =>
        new CustomResponseBuilder()
          .status(200)
          .message('Get District List Success')
          .data(districtList.sort(this.sortByProperty('district')))
          .build(),
      )
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('District List Not Exists').build(),
      );
  }

  public async getExamList(): Promise<CustomResponse> {
    let examList: Syllabus[];
    await this.db
      .getFilteredItemsFromCommonTable(
        DetailTypes.EXAM,
        'examName, grades, subjectIds, imageUrl, colorCode',
      )
      .then((result: Syllabus[]) => (examList = result))
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Exam List Not Exists').build(),
      );

    let subjectList: Subject[];
    await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.SUBJECT, 'subjectType, imageUrl, subjectName')
      .then((result: Subject[]) => (subjectList = result))
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Subject List Not Exists').build(),
      );

    const examListResponse: ExamResponse[] = [];
    examList.map((exam) => {
      const { id, examName, grades, imageUrl, colorCode } = exam;
      const subjects: Subject[] = [];
      exam.subjectIds.forEach((subjectId) => {
        subjects.push(subjectList.find((subject) => subject.id === subjectId));
      });
      examListResponse.push({ id, examName, grades, subjects, imageUrl, colorCode });
    });

    return new Promise((resolve, reject) => {
      resolve(
        new CustomResponseBuilder()
          .status(200)
          .message('Get Exam list success')
          .data(examListResponse)
          .build(),
      );
    });
  }

  public async getSyllabusList(): Promise<CustomResponse> {
    let syllabusList: Syllabus[];
    await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.EXAM, 'examName, imageUrl, colorCode')
      .then((result: Syllabus[]) => (syllabusList = result))
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Syllabus List Not Exists').build(),
      );

    return new Promise((resolve, reject) => {
      resolve(
        new CustomResponseBuilder()
          .status(200)
          .message('Get Syllabus list success')
          .data(syllabusList.sort(this.sortByProperty('examName')))
          .build(),
      );
    });
  }

  public async getSubjectListByExamId(examId: string): Promise<CustomResponse> {
    let subjectIds: string[];

    await this.db
      .getItem(TableTypes.COMMON_DETAILS, { id: examId, detailType: DetailTypes.EXAM.toString() })
      .then((result: Syllabus) => (subjectIds = result.subjectIds))
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Syllabus List Not Exists').build(),
      );

    const transactGetItems: DbParam[] = [];
    for (const subjectId of subjectIds) {
      if (subjectId) {
        transactGetItems.push({
          tableName: TableTypes.COMMON_DETAILS,
          values: { id: subjectId, detailType: 'Subject' },
        });
      }
    }

    const responses: ItemResponseList = await this.db
      .transactGetItems(transactGetItems)
      .then((responses: ItemResponseList) => responses)
      .catch(
        (error) =>
          new Promise((resolve, reject) => {
            reject(new CustomResponseBuilder().status(500).message(error.message).build());
          }),
      );

    const subjectList: any[] = [];
    responses.forEach((response) => {
      delete response.Item.detailType;
      subjectList.push(response.Item);
    });

    return new Promise((resolve, reject) => {
      resolve(
        new CustomResponseBuilder()
          .status(200)
          .message('Get Subject list success')
          .data(subjectList)
          .build(),
      );
    });
  }

  public async getSubjectList(): Promise<CustomResponse> {
    return await this.db
      .getFilteredItemsFromCommonTable(DetailTypes.SUBJECT, 'subjectType, imageUrl, subjectName')
      .then((result: Subject[]) =>
        new CustomResponseBuilder()
          .status(200)
          .message('Get Subject list success')
          .data(result.sort(this.sortByProperty('subjectName')))
          .build(),
      )
      .catch((err) =>
        new CustomResponseBuilder().status(500).message('Subject List Not Exists').build(),
      );
  }

  private sortByProperty(property: string) {
    return (a, b) => {
      return a[property].localeCompare(b[property], 'en');
    };
  }
}
