let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");

router.post("/", async (req, res) => {
  
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const caseRequest =
      req.query.caseRequest || (req.body && req.body.caseRequest);
    
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

    let _caseRequest;

    if (caseRequest) {
      _caseRequest = await axios
        .patch(
          `${tenant}/data/NAVCaseRequestTables(RequestId='${caseRequest.RequestId}')?cross-company=true`,
          {
            DeviceUsageQty: (caseRequest.DeviceUsageQty ? caseRequest.DeviceUsageQty : 0).toString(),
            UsageQty: caseRequest.UsageQty ? caseRequest.UsageQty : 0,
            NAVUsageHour: caseRequest.NAVUsageHour ? caseRequest.NAVUsageHour : 0,
            NAV_ThirdPartyRecId: caseRequest.NAV_ThirdPartyRecId ? caseRequest.NAV_ThirdPartyRecId : "",
            NAV_ThirdPartyName: caseRequest.NAV_ThirdPartyName ? caseRequest.NAV_ThirdPartyName : "",
            NAV_ThirPartyPhone: caseRequest.NAV_ThirPartyPhone ? caseRequest.NAV_ThirPartyPhone : "",
            NAV_ThirPartyMail: caseRequest.NAV_ThirPartyMail ? caseRequest.NAV_ThirPartyMail : ""
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
            console.log(error.response.data.error);
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error("Error", error.message);
          }
        });
    }

    _caseRequest =
      _caseRequest && _caseRequest.data === "" ? "Modified" : "Unchanged";

    

    return res.json({
      result: true,
      message: "OK",
      _caseRequest
    });
    try {
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
