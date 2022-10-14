let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const diagnosticCondition =
      req.query.diagnosticCondition || (req.body && req.body.diagnosticCondition);
    
      if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!diagnosticCondition || diagnosticCondition.length === 0)
      throw new Error("diagnosticCondition is Mandatory");  

    if (!client.isOpen) client.connect();

    let token = await client.get(environment);

    if (!token) {
      const tokenResponse = await axios
        .post(
          `https://login.microsoftonline.com/${tenantUrl}/oauth2/token`,
          `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&resource=${tenant}/`,
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
      token = tokenResponse.data.access_token;
      await client.set(environment, tokenResponse.data.access_token, {
        EX: 3599,
      });
    }

    let _diagnosticCondition;
    let _partCar;
    if (diagnosticCondition) {
      _diagnosticCondition = await axios
        .delete(
          `${tenant}/data/NAVDiagnosticsConditions(dataAreaId='${diagnosticCondition.dataAreaId}',CaseId='${diagnosticCondition.CaseId}',NAVConditionsRequestRefRecId=${diagnosticCondition.NAVConditionsRequestRefRecId},NAVDiagnosticsRefRecId=${diagnosticCondition.NAVDiagnosticsRefRecId})?cross-company=true`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });

        _partCar = await axios
        .delete(
          `${tenant}/data/PartCarTables(dataAreaId='${diagnosticCondition.dataAreaId}',DiagCondRefRecid=${diagnosticCondition.DiagCondRefRecid},LineNum=${diagnosticCondition.LineNum})?cross-company=true`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        )
        .catch(function (error) {
          if (
            error.response &&
            error.response.data &&
            error.response.data.error &&
            error.response.data.error.innererror &&
            error.response.data.error.innererror.message
          ) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });

    }

    _diagnosticCondition =
    _diagnosticCondition && _diagnosticCondition.data === "" ? "Deleted" : "Unchanged";
    _partCar =
    _partCar && _partCar.data === "" ? "Deleted" : "Unchanged";

    return res.json({
      result: true,
      message: "OK",
      _diagnosticCondition,
      _partCar
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
