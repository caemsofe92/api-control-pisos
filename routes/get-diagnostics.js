let express = require("express");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const entity = req.query.entity || (req.body && req.body.entity);
    const numberOfElements =
      req.query.numberOfElements || (req.body && req.body.numberOfElements);
    const isTest = req.query.isTest || (req.body && req.body.isTest);
    const refresh = req.query.refresh || (req.body && req.body.refresh);
    const userCompany =
      req.query.userCompany || (req.body && req.body.userCompany);
    const environment =
      req.query.environment || (req.body && req.body.environment);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!entity || entity.length === 0) throw new Error("entity is Mandatory");

    if (!userCompany || userCompany.length === 0)
      throw new Error("userCompany is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!client.isOpen) client.connect();

    if (!refresh) {
      const mainReply = await client.get(entity + userCompany);
      if (mainReply)
        return res.json({
          result: true,
          message: "OK",
          response: JSON.parse(mainReply),
        });
    }

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

    const Entity1 = axios.get(
      `${tenant}/data/NAVConditionsRequests?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity2 = axios.get(
      `${tenant}/data/PartCarTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity3 = axios.get(
      `${tenant}/data/NAVDiagnostics?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity4 = axios.get(
      `${tenant}/data/NAVDiagnosticsConditions?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    await axios
      .all([
        Entity1,
        Entity2,
        Entity3,
        Entity4
       
      ])
      .then(
        axios.spread(async (...responses) => {

          const reply = {
            NAVConditionsRequests: responses[0].data.value,
            PartCarTables: responses[1].data.value,
            NAVDiagnostics: responses[2].data.value,
            NAVDiagnosticsConditions: responses[3].data.value,
            
          };

          await client.set(entity + userCompany, JSON.stringify(reply), {
            EX: 86400,
          });
          return res.json({ result: true, message: "OK", response: reply });
        })
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
  } catch (error) {
    return res.status(500).json({ result: false, message: error.toString() });
  }
});

module.exports = router;
