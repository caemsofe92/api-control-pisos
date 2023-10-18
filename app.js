var createError = require("http-errors");
var express = require("express");
var cors = require('cors');
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
var CreateInspectionLine =require("./routes/create-inspection-line");
var GetConditions = require("./routes/get-conditions");
var CreateCondition = require("./routes/create-condition");
var CreateConditionDiagnostic = require("./routes/create-condition-diagnostic");
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
var UpdateCaseRequestCustomer = require("./routes/update-case-request-customer");
var deleteDiagnosticsCondition = require("./routes/delete-diagnostics-condition");
var deleteInspections = require("./routes/delete-inspections");
var deletePartCar = require("./routes/delete-part-car");
var updatediagnostics = require("./routes/update-diagnostics");
var updatediagnosticscondition = require("./routes/update-diagnostics-condition");
var updatestatuscanceled = require("./routes/update-status-canceled");
var ordenservicio = require("./routes/create-orden-servicio");
var updateordenservicio = require("./routes/update-orden-servicio");
var updatecustodiandriver = require("./routes/update-custodian-driver");
var deleteordenservicio = require("./routes/delete-orden-servicio");
var getIngress = require("./routes/get-ingress");
var createIngress = require("./routes/create-ingress");
var getExit = require("./routes/get-exit");
var updateIngress = require("./routes/update-ingress");
var updateNAVTruckEntrances = require("./routes/update-NAVTruckEntrances");
var updatecustodiandrivertree = require("./routes/update-custodian-driver-tree");
var gethometecnical = require("./routes/get-home-tecnical");
var getroles = require("./routes/get-roles");
var createactivity = require("./routes/create-activity");

var updateload = require("./cooltrackRoutes/update-load");
var updateShipment = require("./cooltrackRoutes/update-shipment");
var getLoadShipment = require("./cooltrackRoutes/get-Load-Shipment");
var deleteload = require("./cooltrackRoutes/delete-load");
var deleteShipment = require("./cooltrackRoutes/delete-shipment");
var getLinesTMS=require("./cooltrackRoutes/get-lines-tms");
var SetLoadLine=require("./cooltrackRoutes/Set-Load-Line");
var GetWHSShipment=require("./cooltrackRoutes/get-whs-shipment");
var getLoadFullData = require("./cooltrackRoutes/get-load-full-data");
var searchinvoicepakingslip = require("./cooltrackRoutes/search-invoice-pakingslip");
var restoredriverstatus = require("./cooltrackRoutes/restore-driver-status");
var setInvoiceHeader = require("./cooltrackRoutes/set-invoice-header");
var SetNameTMSLine = require("./cooltrackRoutes/Set-Name-TMS-Line");

//TodoList Angelo

var CreatedUserTodoList = require("./TodoListAngelo/Created-User-TodoList");
var createdTask = require("./TodoListAngelo/created-Task");
var updateTask = require("./TodoListAngelo/update-Task");
//************ */

var app = express();
app.use(cors({origin:'*', methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/", indexRouter);
app.use("/request-vehicle", RequestVehicle);
app.use("/get-inspection", GetInspection);
app.use("/create-condition", CreateCondition);
app.use("/create-condition-diagnostic", CreateConditionDiagnostic);
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
app.use("/create-inspection-line", CreateInspectionLine);
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
app.use("/update-case-request-customer", UpdateCaseRequestCustomer);
app.use("/delete-diagnostics-condition", deleteDiagnosticsCondition);
app.use("/delete-inspections", deleteInspections);
app.use("/delete-part-car", deletePartCar);
app.use("/update-diagnostics", updatediagnostics);
app.use("/update-diagnostics-condition", updatediagnosticscondition);
app.use("/update-status-canceled", updatestatuscanceled);
app.use("/create-orden-servicio", ordenservicio);
app.use("/update-orden-servicio", updateordenservicio);
app.use("/delete-orden-servicio", deleteordenservicio);
app.use("/get-ingress", getIngress);
app.use("/create-ingress", createIngress);
app.use("/get-exit", getExit);
app.use("/update-ingress", updateIngress);
app.use("/update-NAVTruckEntrances", updateNAVTruckEntrances);
app.use("/update-custodian-driver", updatecustodiandriver);
app.use("/update-custodian-driver-tree", updatecustodiandrivertree);
app.use("/get-home-tecnical", gethometecnical);
app.use("/get-roles", getroles);
app.use("/create-activity", createactivity);

app.use("/update-load", updateload);
app.use("/update-shipment", updateShipment);
app.use("/get-load-shipment", getLoadShipment);
app.use("/delete-load", deleteload);
app.use("/delete-shipment", deleteShipment);
app.use("/get-lines-tms", getLinesTMS);
app.use("/set-load-line", SetLoadLine);
app.use("/get-whs-shipment", GetWHSShipment);

app.use("/get-load-full-data", getLoadFullData);
app.use("/search-invoice-pakingslip", searchinvoicepakingslip);
app.use("/set-invoice-header", setInvoiceHeader);
app.use("/restore-driver-status", restoredriverstatus);
app.use("/Set-Name-TMS-Line", SetNameTMSLine);

//TodoList Angelo

app.use("/Created-User-TodoList", CreatedUserTodoList);
app.use("/created-Task", createdTask);
app.use("/update-Task", updateTask);
//************ */
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
