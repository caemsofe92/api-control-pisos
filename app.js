var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
const compression = require("compression");
const dotenv = require('dotenv');
dotenv.config();

var indexRouter = require("./routes/index");
var RequestVehicle = require("./routes/request-vehicle");
var GetIdentification = require("./routes/get-identification");
var CreateDriver = require("./routes/create-custodian-driver");
var GetHome = require("./routes/get-home");
var ClockInClockOut = require("./routes/clockin-clockout");
var ControlTecnico = require("./routes/service-center-control-tecnico");
var GetClock = require("./routes/get-clock");
var GetWatchman = require("./routes/get-watchman");
var CreateCaseRequest = require("./routes/create-case-request");
var UpdateCaseRequest = require("./routes/update-case-request");
var UpdateCaseRequestDate = require("./routes/update-case-request-date");
var UpdateCaseRequestQty = require("./routes/update-case-request-qty");
var CreateCustomerParty = require("./routes/create-customer-party");
var GetDiagnostics =require("./routes/get-diagnostics");
var GetInspection = require("./routes/get-inspection");
var CreateInspection =require("./routes/create-inspection");
var UpdateInspectionLine =require("./routes/update-inspection-line");
var GetConditions = require("./routes/get-conditions");
var CreateCondition = require("./routes/create-condition");
var GetResourceAssignment =require("./routes/get-resource-assignment");
var UpdateResourceAssignment =require("./routes/update-resource-assignment");
var CreateDiagnostics =require("./routes/create-diagnostics");
var CreateParCar =require("./routes/create-part-car");
var CreateDiagnosticsCondition =require("./routes/create-diagnostics-condition");
var RequestCustChange =require("./routes/request-cust-change");
var CreateCase =require("./routes/create-case");
var UpdateConditionResource =require("./routes/update-condition-resource");
var UpdateCondition =require("./routes/update-condition");
var DeleteCondition =require("./routes/delete-condition");
var DeleteDiagnostics = require("./routes/delete-diagnosticss");
var GetDeviceLastUsageQty = require("./routes/get-device-last-usage-qty");


var app = express();
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/", indexRouter);
app.use("/request-vehicle", RequestVehicle);
app.use("/get-inspection", GetInspection);
app.use("/create-condition", CreateCondition);
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
app.use("/update-case-request-date", UpdateCaseRequestDate);
app.use("/update-case-request-qty", UpdateCaseRequestQty);
app.use("/create-customer-party", CreateCustomerParty);
app.use("/get-diagnostics", GetDiagnostics);
app.use("/create-inspection", CreateInspection);
app.use("/update-inspection-line", UpdateInspectionLine);
app.use("/get-resource-assignment", GetResourceAssignment);
app.use("/update-resource-assignment", UpdateResourceAssignment);
app.use("/create-diagnostics", CreateDiagnostics);
app.use("/create-part-car",CreateParCar);
app.use("/create-diagnostics-condition", CreateDiagnosticsCondition);
app.use("/request-cust-change", RequestCustChange);
app.use("/create-case", CreateCase);
app.use("/update-condition-resource", UpdateConditionResource);
app.use("/update-condition", UpdateCondition);
app.use("/delete-condition", DeleteCondition);
app.use("/delete-diagnosticss", DeleteDiagnostics);
app.use("/get-device-last-usage-qty", GetDeviceLastUsageQty);

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
