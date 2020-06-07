import { Container } from "inversify";
import "reflect-metadata";

const DIContainer = new Container();
// DIContainer.bind<DynamoDbAdapterImpl>(DynamoDbAdapterImpl).toSelf();

export default DIContainer;
