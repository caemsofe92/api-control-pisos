let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const moment = require("moment");
require('moment/locale/es');

router.post("/", async (req, res) => {
  
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const activity =
      req.query.activity || (req.body && req.body.activity);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!activity || activity.length === 0)
      throw new Error("diagnostics is Mandatory");;

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
    
    let _activity = await axios
      .post(
        `${tenant}/data/SRF_smmActivities?$format=application/json;odata.metadata=none`,
        activity,
        { headers: { Authorization: "Bearer " + token } }
      )
      .catch(function (error) {
        console.log(error);
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

    _activity = _activity.data;

    return res.json({
      result: true,
      message: "OK",
      _activity,
    });
    try {} catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;