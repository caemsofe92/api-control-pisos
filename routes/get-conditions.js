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
      `${tenant}/data/CaseOprModels?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity3 = axios.get(
      `${tenant}/data/DeviceBrands?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity4 = axios.get(
      `${tenant}/data/CaseRecallTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity5 = axios.get(
      `${tenant}/data/CaseRecallLines?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity6 = axios.get(
      `${tenant}/data/InspectionFaultTrans?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity7 = axios.get(
      `${tenant}/data/SRF_AMCaseServicePlans?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity8 = axios.get(
      `${tenant}/data/CaseServicePlanReferences?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity9 = axios.get(
      `${tenant}/data/DeviceWarrantyTransCollection?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );
    
    const Entity10 = axios.get(
      `${tenant}/data/ContractTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity11 = axios.get(
      `${tenant}/data/ContractLines?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity12 = axios.get(
      `${tenant}/data/NAVCaseRequestTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$filter=Status eq Microsoft.Dynamics.DataEntities.AMCaseRequestStatus'Created' or Status eq Microsoft.Dynamics.DataEntities.AMCaseRequestStatus'Confirmed'`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity13 = axios.get(
      `${tenant}/data/DimAttributeWrkCtrResourceGroups?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity14 = axios.get(
      `${tenant}/data/SRF_DimAttributeWrkCtrTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$filter=WrkCtrType eq Microsoft.Dynamics.DataEntities.WrkCtrType'Location'`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity15 = axios.get(
      `${tenant}/data/Workers?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true&$select=PersonnelNumber,TitleId,WorkerType,Name,PartyNumber`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity16 = axios.get(
      `${tenant}/data/NAVWrkCtrs?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=WrkCtrId,WrkCtrType,Name,hcmWorker_PersonnelNumber,DirPerson_FK_PartyNumber`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity17 = axios.get(
      `${tenant}/data/CaseGroups?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=GroupId,ProjGroupId,Description`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity18 = axios.get(
      `${tenant}/data/CaseTypes?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=TypeId,Description`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity19 = axios.get(
      `${tenant}/data/CasePriorities?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=PriorityId,Description`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity20 = axios.get(
      `${tenant}/data/SRF_SystemTables?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=SystemId,SystemName`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity21 = axios.get(
      `${tenant}/data/TypeConditions?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true${
        userCompany ? `&$filter=dataAreaId eq '${userCompany}'` : ""
      }&$select=TypeConditionId,TypeConditionName`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity22 = axios.get(
      `${tenant}/data/SRF_AMDeviceTable?$format=application/json;odata.metadata=none${
        isTest && numberOfElements ? "&$top=" + numberOfElements : ""
      }&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const Entity23 = axios.get(
      `${tenant}/data/NAVWrkCtrResourceGroups?$format=application/json;odata.metadata=none${
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
        Entity15,
        Entity16,
        Entity17,
        Entity18,
        Entity19,
        Entity20,
        Entity21,
        Entity22,
        Entity23
      ])
      .then(
        axios.spread(async (...responses) => {

          const reply = {
            NAVConditionsRequests: responses[0].data.value,
            CaseOprModels: responses[1].data.value,
            DeviceBrands: responses[2].data.value,
            CaseRecallLines: responses[4].data.value,
            CaseRecallTables: responses[3].data.value,
            InspectionFaultTrans: responses[5].data.value,
            SRF_AMCaseServicePlans: responses[6].data.value,
            CaseServicePlanReferences: responses[7].data.value,
            DeviceWarrantyTransCollection: responses[8].data.value,
            ContractTables: responses[9].data.value,
            ContractLines: responses[10].data.value,
            NAVCaseRequestTables: responses[11].data.value,
            DimAttributeWrkCtrResourceGroups: responses[12].data.value,
            SRF_DimAttributeWrkCtrTables: responses[13].data.value,
            Workers: responses[14].data.value,
            NAVWrkCtrs: responses[15].data.value,
            CaseGroups: responses[16].data.value,
            CaseTypes: responses[17].data.value,
            CasePriorities: responses[18].data.value,
            SRF_SystemTables: responses[19].data.value,
            TypeConditions: responses[20].data.value,
            SRF_DeviceTableMasters: responses[21].data.value,
            NAVWrkCtrResourceGroups: responses[22].data.value
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
