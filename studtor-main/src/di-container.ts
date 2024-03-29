import { Container } from 'inversify';
import { DynamoDbAdapterImpl } from './dependency/database/dynamoDb/dynamoDbAdapterImpl';
import { DynamoDbQueryGenerator } from './dependency/database/dynamoDb/dynamoDbQueryGenerator';
import { SesMailHandlerImpl } from './dependency/mailservice/ses/SesMailHandlerImpl';
import { ActivateDetailsGenerator } from './dependency/activateDetailsGenerator';
import { OTPcodeGenerator } from './dependency/otpCodeGenerator';
import { S3FileHandlerImpl } from './dependency/fileHandler/s3FileHandler/s3FileHandlerImpl';
import { ElasticSearchAdapterImpl } from './dependency/database/elasticSearch/elasticSearchAdapterImpl';
import { ElasticSearchQueryGenerator } from './dependency/database/elasticSearch/elasticSearchQueryGenerator';

const DIContainer = new Container();
DIContainer.bind<DynamoDbAdapterImpl>(DynamoDbAdapterImpl).toSelf();
DIContainer.bind<DynamoDbQueryGenerator>(DynamoDbQueryGenerator).toSelf();
DIContainer.bind<ElasticSearchQueryGenerator>(ElasticSearchQueryGenerator).toSelf();
DIContainer.bind<SesMailHandlerImpl>(SesMailHandlerImpl).toSelf();
DIContainer.bind<ActivateDetailsGenerator>(ActivateDetailsGenerator).toSelf();
DIContainer.bind<OTPcodeGenerator>(OTPcodeGenerator).toSelf();
DIContainer.bind<S3FileHandlerImpl>(S3FileHandlerImpl).toSelf();
DIContainer.bind<ElasticSearchAdapterImpl>(ElasticSearchAdapterImpl).toSelf();

export default DIContainer;
