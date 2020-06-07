import express from "express";
import * as bodyParser from "body-parser";
import { RegisterRoutes } from "./routes";

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require(__dirname + "/swagger.json");
const PORT = 3000;
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/swagger.json", (req, res) => {
  res.sendFile(__dirname + "/swagger.json");
});

app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

RegisterRoutes(app);

app.listen(PORT, () => {
  console.log(`Starting server on port ${PORT} ...`);
});
