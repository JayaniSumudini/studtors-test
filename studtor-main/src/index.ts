import './controllers/clientController';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as methodOverride from 'method-override';
import { RegisterRoutes } from './routes';
import errorHandler from './errorHandler';

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require(__dirname + '/swagger.json');
const PORT = process.env.PORT || 3001;

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/swagger.json', (req, res) => {
  res.sendFile(__dirname + '/swagger.json');
});

app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

RegisterRoutes(app);
errorHandler(app);

/* tslint:disable-next-line */
app.listen(PORT, () => {
  console.log(`Starting server on port ${PORT} ...`);
});
