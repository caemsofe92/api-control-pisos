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
    const WorkshopLocationId =
      req.query.WorkshopLocationId || (req.body && req.body.WorkshopLocationId);

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

    if (!WorkshopLocationId || WorkshopLocationId.length === 0)
      throw new Error("WorkshopLocationId is Mandatory");

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
      `${tenant}/data/CaseTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$filter=WorkshopLocationId eq '${WorkshopLocationId}' and Status ne Microsoft.Dynamics.DataEntities.AMCaseStatus'Finished' and Status ne Microsoft.Dynamics.DataEntities.AMCaseStatus'Closed' and Status ne Microsoft.Dynamics.DataEntities.AMCaseStatus'Invoiced' and Status ne Microsoft.Dynamics.DataEntities.AMCaseStatus'Cancelled'`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity2 = axios.get(
      `${tenant}/data/SRF_Workers?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$select=RecId1,Name,PersonnelNumber`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity3 = axios.get(
      `${tenant}/data/SRF_AMDeviceTable?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity4 = axios.get(
      `${tenant}/data/SRF_AMInspectionLines?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity5 = axios.get(
      `${tenant}/data/InspectionCategoryInputs?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity6 = axios.get(
      `${tenant}/data/InspectionInputTypes?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity7 = axios.get(
      `${tenant}/data/SRF_InspectionGroups?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity8 = axios.get(
      `${tenant}/data/SRF_AMInspectionTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity9 = axios.get(
      `${tenant}/data/SRF_InspectionCategories?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity10 = axios.get(
      `${tenant}/data/InspectionListLines?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity11 = axios.get(
      `${tenant}/data/InspectionLists?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity12 = axios.get(
      `${tenant}/data/SRF_InspectionFaultTrans?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity13 = axios.get(
      `${tenant}/data/NAVConditionsRequests?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity14 = axios.get(
      `${tenant}/data/SRF_DocuRef?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$select=OriginalFileName,RefRecId&$filter=${
        userCompany ? `RefCompanyId eq '${userCompany}' and ` : ""
      }RefTableId eq 66094 and TypeId eq 'File' and OriginalFileName eq '*sscinsevimage*'`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity15 = axios.get(
      `${tenant}/data/SRF_DocuValue?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );
    await axios
      .all([
        Entity1,
        Entity2,
        Entity3,
        Entity4,
        Entity5,
        Entity6,
        Entity7,
        Entity8,
        Entity9,
        Entity10,
        Entity11,
        Entity12,
        Entity13,
        Entity14,
        Entity15
      ])
      .then(
        axios.spread(async (...responses) => {

          const reply = {
            CaseTables: responses[0].data.value,
            SRF_Workers: responses[1].data.value,
            SRF_AMDeviceTable: responses[2].data.value,
            SRF_AMInspectionLines: responses[3].data.value,
            InspectionCategoryInputs: responses[4].data.value,
            InspectionInputTypes: responses[5].data.value,
            SRF_InspectionGroups: responses[6].data.value,
            SRF_InspectionTables: responses[7].data.value,
            InspectionCategories: responses[8].data.value,
            InspectionListLines: responses[9].data.value,
            InspectionLists: responses[10].data.value,
            InspectionFaultTrans: responses[11].data.value,
            NAVConditionsRequests: responses[12].data.value,
            SRF_DocuRef: responses[13].data.value,
            SRF_DocuValue: responses[14].data.value
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
