let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const moment = require("moment");
require("moment/locale/es");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const ingress =
      req.query.ingress || (req.body && req.body.ingress);
    
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

    let _ingress;

    if (ingress) {
      _ingress = await axios
        .patch(
          `${tenant}/data/NAVTruckEntrances(dataAreaId='${ingress.dataAreaId}',NAVEntranceId='${ingress.NAVEntranceId}')?$format=application/json;odata.metadata=none`,
          ingress,
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

    _ingress =
      _ingress && _ingress.data === "" ? "Modified" : "Unchanged";

      let _IngressRequest = null;
   
      let RequestEntrances = await axios
      .get(
        `${tenant}/data/TruckCaseRequests?$format=application/json;odata.metadata=none&cross-company=true&$filter=dataAreaId eq '${ingress.dataAreaId}' and RequestId eq '${ingress.RequestId}' and NAVTruckEntrance_NAVEntranceId eq '${ingress.NAVEntranceId}'`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );

      if(ingress.RequestId && RequestEntrances.data.value.length === 0){
        _IngressRequest = await axios
        .post(
          `${tenant}/data/TruckCaseRequests?cross-company=true`,
          {
            dataAreaId: ingress.dataAreaId,
            RequestId: ingress.RequestId,
            NAVTruckEntrance_NAVEntranceId: ingress.NAVEntranceId
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
  
      _IngressRequest = _IngressRequest.data;
      }

    return res.json({
      result: true,
      message: "OK",
      _ingress,
      _IngressRequest
    });
   
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
