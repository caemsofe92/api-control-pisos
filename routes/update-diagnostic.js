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
    const diagnostic =
      req.query.diagnostic || (req.body && req.body.diagnostic);
    const diagnosticLine =
      req.query.diagnosticLine || (req.body && req.body.diagnosticLine);
    const improvementOpportunities =
      req.query.improvementOpportunities ||
      (req.body && req.body.improvementOpportunities);
    const evidences = req.query.evidences || (req.body && req.body.evidences);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

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

    let _diagnostic;

    if (diagnostic) {
      _diagnostic = await axios
        .patch(
          `${tenant}/data/DiagnosticNews(RecIdGen=${diagnostic.RecIdGen},dataAreaId='${diagnostic.dataAreaId}')?cross-company=true`,
          diagnostic,
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

    _diagnostic =
      _diagnostic && _diagnostic.data === "" ? "Modified" : "Unchanged";

    let _diagnosticLine = [];

    if (diagnosticLine && diagnosticLine.length > 0) {
      for (let i = 0; i < diagnosticLine.length; i++) {
        const line = diagnosticLine[i];
        const __diagnosticLine = await axios
          .patch(
            `${tenant}/data/SRF_HSEDiagnosticLine(dataAreaId='${diagnostic.dataAreaId}',SRF_HSEIdDiagnostic='${diagnostic.SRF_HSEIdDiagnostic}',RecId1=${line.RecId1},Line=${line.Line})?cross-company=true`,
            line,
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
            } else if (
              error.response &&
              error.response.data &&
              error.response.data.Message
            ) {
              throw new Error(error.response.data.Message);
            } else {
              throw new Error("Error", error.message);
            }
          });
        _diagnosticLine.push(
          __diagnosticLine && __diagnosticLine.data === ""
            ? "Modified"
            : "Unchanged"
        );
      }
    }

    let _improvementOpportunities = [];

    if (improvementOpportunities && improvementOpportunities.length > 0) {
      for (let i = 0; i < improvementOpportunities.length; i++) {
        const opportunity = improvementOpportunities[i];
        const opportunityResponse = await axios
          .post(
            `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
            {
              ...opportunity,
              _dataAreaId: diagnostic.dataAreaId,
              _idOrigin: diagnostic.SRF_HSEIdDiagnostic,
              _detectionDate: diagnostic.ExecutionDate,
              _state: 0,
              _hcmEmploymentType: 0,
              _origin: 1,
              _tableID: 17070,
            },
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
        _improvementOpportunities.push(opportunityResponse.data);
      }
    }

    return res.json({
      result: true,
      message: "OK",
      _diagnostic,
      _diagnosticLine,
      _improvementOpportunities,
      _evidences: [],
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
