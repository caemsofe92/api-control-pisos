var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
const compression = require("compression");
const dotenv = require('dotenv');
dotenv.config();

var indexRouter = require("./routes/index");
var RequestVehicle = require("./routes/request-vehicle");
var UpdateRAICRouter = require("./routes/update-raic");
var UpdateDiagnosticRouter = require("./routes/update-diagnostic");
var GetConditions = require("./routes/get-conditions");
var GetIdentification = require("./routes/get-identification");
var CreateDriver = require("./routes/create-custodian-driver");
var GetHome = require("./routes/get-home");
var ClockInClockOut = require("./routes/clockin-clockout");
var ControlTecnico = require("./routes/service-center-control-tecnico");
var GetClock = require("./routes/get-clock");
var GetWatchman = require("./routes/get-watchman");
var CreateCaseRequest = require("./routes/create-case-request");
var UpdateCaseRequest = require("./routes/update-case-request");
var CreateCustomerParty = require("./routes/create-customer-party");


var app = express();
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/", indexRouter);
app.use("/request-vehicle", RequestVehicle);
app.use("/update-raic", UpdateRAICRouter);
app.use("/update-diagnostic", UpdateDiagnosticRouter);
app.use("/get-conditions", GetConditions);
app.use("/get-identification", GetIdentification);
app.use("/create-custodian-driver", CreateDriver);
app.use("/get-home", GetHome);
app.use("/clockin-clockout", ClockInClockOut);
app.use("/service-center-control-tecnico", ControlTecnico);
app.use("/get-clock", GetClock);
app.use("/get-watchman", GetWatchman);
app.use("/create-case-request", CreateCaseRequest);
app.use("/update-case-request", UpdateCaseRequest);
app.use("/create-customer-party", CreateCustomerParty);

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
