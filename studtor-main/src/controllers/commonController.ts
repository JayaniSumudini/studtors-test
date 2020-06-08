import { Route, Tags, Get, SuccessResponse, Request, Path } from 'tsoa';
import 'reflect-metadata';
import { SuperController } from './superController';
import DIContainer from '../di-container';
import { CommonService } from '../services/commonService';
import { APIResponse } from '../models/apiResponse';

@Route('common')
export class CommonController extends SuperController {
  private commonService: CommonService = DIContainer.resolve<CommonService>(CommonService);

  /**
   * Get a University List
   */
  @Get('universities')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getUniversityList(): Promise<APIResponse> {
    return this.commonService
      .getUniversityList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get a Nationality List
   */
  @Get('nationalities')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getNationalityList(): Promise<APIResponse> {
    return this.commonService
      .getNationalityList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get a Language List
   */
  @Get('languages')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getLanguagesList(): Promise<APIResponse> {
    return this.commonService
      .getLanguagesList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get a District List
   */
  @Get('district')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getDistrictList(): Promise<APIResponse> {
    return this.commonService
      .getDistrictList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all Exam List with grades and subjects
   */
  @Get('exams')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getExamList(): Promise<APIResponse> {
    return this.commonService
      .getExamList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all Exam List with id and name
   */
  @Get('syllabus')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getSyllabusList(): Promise<APIResponse> {
    return this.commonService
      .getSyllabusList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get Subjects For Exam by examId
   */
  @Get('{examId}/subjects')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getSubjectListByExamId(@Path() examId: string): Promise<APIResponse> {
    return this.commonService
      .getSubjectListByExamId(examId)
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }

  /**
   * Get all Subject List
   */
  @Get('subjects')
  @Tags('Common')
  @SuccessResponse('200', 'OK')
  public async getSubjectList(): Promise<APIResponse> {
    return this.commonService
      .getSubjectList()
      .then((result) => this.sendResponse(result))
      .catch((error) => this.sendResponse(error));
  }
}
