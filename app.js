var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
const compression = require("compression");
const dotenv = require('dotenv');
dotenv.config();

var indexRouter = require("./routes/index");
var requestVehicle = require("./routes/request-vehicle");
var updateRAICRouter = require("./routes/update-raic");
var updateDiagnosticRouter = require("./routes/update-diagnostic");
var getHome = require("./routes/get-home");
var getIdentification = require("./routes/get-identification");
var getDiagnostic = require("./routes/get-diagnostic");
var getHomeCP = require("./routes/get-home-cp");
var ClockInClockOut = require("./routes/clockin-clockout");
var ControlTecnico = require("./routes/service-center-control-tecnico");
var GetClock = require("./routes/get-clock");
var GetWatchman = require("./routes/get-watchman");
var CreateCaseRequest = require("./routes/create-case-request");
var UpdateCaseRequest = require("./routes/update-case-request");


var app = express();
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/", indexRouter);
app.use("/request-vehicle", requestVehicle);
app.use("/update-raic", updateRAICRouter);
app.use("/update-diagnostic", updateDiagnosticRouter);
app.use("/get-home", getHome);
app.use("/get-identification", getIdentification);
app.use("/get-diagnostic", getDiagnostic);
app.use("/get-home-cp", getHomeCP);
app.use("/clockin-clockout", ClockInClockOut);
app.use("/service-center-control-tecnico", ControlTecnico);
app.use("/get-clock", GetClock);
app.use("/get-watchman", GetWatchman);
app.use("/create-case-request", CreateCaseRequest);
app.use("/update-case-request", UpdateCaseRequest);


app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;
