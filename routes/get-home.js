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
    const refresh = req.query.refresh || (req.body && req.body.refresh);
    const userEmail = req.query.userEmail || (req.body && req.body.userEmail);
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

    if (!userEmail || userEmail.length === 0)
      throw new Error("userEmail is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!client.isOpen) client.connect();

    if (!refresh) {
      const userReply = await client.get(entity + userEmail);
      if (userReply)
        return res.json({
          result: true,
          message: "OK",
          response: JSON.parse(userReply),
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

    let _mainReply;
    let mainReply;

    if (!refresh) {
      _mainReply = await client.get(entity);
    }

    if (!_mainReply || refresh) {
      const Entity1 = axios.get(
        `${tenant}/data/SRF_AMCaseWorkshopLocation?$format=application/json;odata.metadata=none&cross-company=true`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const Entity2 = axios.get(
        `${tenant}/data/SRF_Workers?$format=application/json;odata.metadata=none&cross-company=true`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const Entity3 = axios.get(
        `${tenant}/data/Companies?$format=application/json;odata.metadata=none&cross-company=true&$select=DataArea,Name`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const Entity4 = axios.get(
        `${tenant}/data/NAVWrkCtrs?$format=application/json;odata.metadata=none&cross-company=true&$select=WrkCtrId,DirPerson_FK_PartyNumber`,
        { headers: { Authorization: "Bearer " + token } }
      );
      const Entity5 = axios.get(
        `${tenant}/data/CaseWorkshopLocationResources?$format=application/json;odata.metadata=none&cross-company=true&$select=WrkCtrId,LocationId,dataAreaId`,
        { headers: { Authorization: "Bearer " + token } }
      );
      
    const Entity6 = axios.get(
      `${tenant}/data/SRF_CaseEmplTables?$format=application/json;odata.metadata=none&cross-company=true`,
      { headers: { Authorization: "Bearer " + token } }
    );

      await axios
        .all([Entity1, Entity2, Entity3, Entity4, Entity5, Entity6])
        .then(
          axios.spread(async (...responses) => {
            mainReply = {
              SRF_AMCaseWorkshopLocation: responses[0].data.value,
              Workers: responses[1].data.value,
              Companies: responses[2].data.value,
              NAVWrkCtrs: responses[3].data.value,
              CaseWorkshopLocationResources: responses[4].data.value,
              CaseEmplTables: responses[5].data.value
            };

            await client.set(entity, JSON.stringify(mainReply), {
              EX: 9999999,
            });
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
    } else {
      mainReply = JSON.parse(_mainReply);
    }

    const Entity1 = axios.get(
      `${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name`,
      { headers: { Authorization: "Bearer " + token } }
    );
    const Entity2 = axios.get(
      `${tenant}/data/PersonUsers?$format=application/json;odata.metadata=none&cross-company=true&$filter=UserEmail eq '${userEmail}'&$select=UserId,PersonName,PartyNumber`,
      { headers: { Authorization: "Bearer " + token } }
    );

    await axios
      .all([Entity1, Entity2])
      .then(
        axios.spread(async (...responses) => {
          const _PersonUsers = responses[1].data.value;

          let PersonUsers = {};
          let Workers = {};
          let CaseWorkshopLocationResources = {};
          let CaseEmplTables
          if (_PersonUsers.length > 0) {
            PersonUsers = _PersonUsers[0];
            const _Workers = mainReply.Workers.filter(
              (item) => item.PartyNumber === PersonUsers.PartyNumber
            );

            if (_Workers.length > 0) {
              Workers = _Workers[0];
            }

            const _NAVWrkCtrs = mainReply.NAVWrkCtrs.filter(
              (item) =>
                item.DirPerson_FK_PartyNumber === PersonUsers.PartyNumber
            );

            const _CaseEmplTables = mainReply.CaseEmplTables.filter(
              (item) =>
                item.HcmWorker_PersonnelNumber === Workers.PersonnelNumber
            );

            if (_CaseEmplTables.length > 0) {
              CaseEmplTables = _CaseEmplTables[0];
            }

            if (_NAVWrkCtrs.length > 0) {
              const _CaseWorkshopLocationResources =
                mainReply.CaseWorkshopLocationResources.filter(
                  (item) => item.WrkCtrId === _NAVWrkCtrs[0].WrkCtrId
                );

              if (_CaseWorkshopLocationResources.length > 0) {
                CaseWorkshopLocationResources =
                  _CaseWorkshopLocationResources[0];
              }
            }
          }

          const userReply = {
            Roles: responses[0].data.value.map((Rol) => {
              return { Name: Rol.Name };
            }),
            UserData: {
              UserId: PersonUsers.UserId,
              PersonName: PersonUsers.PersonName,
              PartyNumber: PersonUsers.PartyNumber,
              PersonnelNumber: Workers.PersonnelNumber,
              Company: CaseWorkshopLocationResources.dataAreaId,
              LocationId: CaseWorkshopLocationResources.LocationId,
              RecId: Workers.RecId1,
              WrkCtrId: _NAVWrkCtrs[0].WrkCtrId
            },
            Companies: mainReply.Companies,
            SRF_AMCaseWorkshopLocation: mainReply.SRF_AMCaseWorkshopLocation,
            CaseEmplTables
          };

          await client.set(entity + userEmail, JSON.stringify(userReply), {
            EX: 3599,
          });

          return res.json({ result: true, message: "OK", response: userReply });
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
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
