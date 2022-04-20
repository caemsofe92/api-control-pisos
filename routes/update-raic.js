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
    const unsafeCondition =
      req.query.unsafeCondition || (req.body && req.body.unsafeCondition);
    const improvementOpportunity =
      req.query.improvementOpportunity ||
      (req.body && req.body.improvementOpportunity);
    const eventDetails =
      req.query.eventDetails || (req.body && req.body.eventDetails);
    const deleteEventCauses =
      req.query.deleteEventCauses || (req.body && req.body.deleteEventCauses);
    const eventCauses =
      req.query.eventCauses || (req.body && req.body.eventCauses);
    const deletePotentialEventDamage =
      req.query.deletePotentialEventDamage ||
      (req.body && req.body.deletePotentialEventDamage);
    const potentialEventDamage =
      req.query.potentialEventDamage ||
      (req.body && req.body.potentialEventDamage);
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

    let _unsafeCondition;

    /*
    if (unsafeCondition) {
      _unsafeCondition = await axios.patch(
        `${tenant}/data/SRF_HSEUnsafeConditionsReport(RecId1=${unsafeCondition.RecId1},dataAreaId='${unsafeCondition.dataAreaId}',WorkerNumber='${unsafeCondition.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
        {
          ...unsafeCondition,
          Responsible: unsafeCondition.Responsible.toString(),
          SRF_HSEIdImprovementOpportunities: undefined,
          CreatedByForUser: undefined
        },
        {
          headers: { Authorization: "Bearer " + token, "If-Match": "*" },
          
        }
      ).catch(function (error) {
          if (error.response && error.response.data && error.response.data.error && error.response.data.error.innererror && error.response.data.error.innererror.message) {
            throw new Error(error.response.data.error.innererror.message);
          } else if (error.request) {
            throw new Error(error.request);
          } else {
            throw new Error('Error', error.message);
          }
        });
    }
    */

    _unsafeCondition =
      _unsafeCondition && _unsafeCondition.data === ""
        ? "Modified"
        : "Unchanged";

    let _improvementOpportunity;

    if (improvementOpportunity && improvementOpportunity.length > 0) {
      _improvementOpportunity = await axios
        .post(
          `${tenant}/api/services/SRF_HSEDocuRefServicesGroup/SRF_HSEDocuRefServices/createOpportunities`,
          {
            _description: improvementOpportunity,
            _dataAreaId: unsafeCondition.dataAreaId,
            _idOrigin: unsafeCondition.SRF_HSEIdUnsafeCondition,
            _detectionDate: unsafeCondition.UtcDrawingDate,
            _refRecId: unsafeCondition.RecId1,
            _state: 0,
            _hcmEmploymentType: 0,
            _origin: 8,
            _tableID: 20371,
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
    }

    _improvementOpportunity =
      _improvementOpportunity && _improvementOpportunity.data
        ? _improvementOpportunity.data
        : "Unchanged";

    let _eventDetails;

    if (eventDetails) {
      _eventDetails = await axios
        .patch(
          `${tenant}/data/SRF_HSEEventDetails(RecId1=${eventDetails.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}')?cross-company=true`,
          eventDetails,
          {
            headers: { Authorization: "Bearer " + token, "If-Match": "*" },
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

    _eventDetails =
      _eventDetails && _eventDetails.data === "" ? "Modified" : "Unchanged";

    let _deleteEventCauses = [];

    if (deleteEventCauses && deleteEventCauses.length > 0) {
      for (let i = 0; i < deleteEventCauses.length; i++) {
        const deleteCause = deleteEventCauses[i];
        const __deleteEventCauses = await axios
          .delete(
            `${tenant}/data/SRF_HSEEventCauses(RecId1=${deleteCause.RecId1},dataAreaId='${eventDetails.dataAreaId}',SRF_HSEIdUnsafeCondition='${eventDetails.SRF_HSEIdUnsafeCondition}',IdCausal='${deleteCause.IdCausal}')?cross-company=true`,
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
        _deleteEventCauses.push(
          __deleteEventCauses && __deleteEventCauses.data === ""
            ? "Deleted"
            : "Unchanged"
        );
      }
    }

    let _eventCauses = [];

    if (eventCauses && eventCauses.length > 0) {
      for (let i = 0; i < eventCauses.length; i++) {
        const cause = eventCauses[i];
        const causeResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEEventCauses?cross-company=true&$format=application/json;odata.metadata=none`,
            {
              dataAreaId: eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: eventDetails.RecId1,
              ...cause,
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
        _eventCauses.push(causeResponse.data);
      }
    }

    let _deletePotentialEventDamage = [];

    if (deletePotentialEventDamage && deletePotentialEventDamage.length > 0) {
      for (let i = 0; i < deletePotentialEventDamage.length; i++) {
        const damage = deletePotentialEventDamage[i];
        const __deletePotentialEventDamage = await axios
          .delete(
            `${tenant}/data/SRF_HSEPotentialEventDamage(RecId1=${damage.RecId1},dataAreaId='${eventDetails.dataAreaId}')?cross-company=true`,
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
        _deletePotentialEventDamage.push(
          __deletePotentialEventDamage &&
            __deletePotentialEventDamage.data === ""
            ? "Deleted"
            : "Unchanged"
        );
      }
    }

    let _potentialEventDamage = [];

    if (potentialEventDamage && potentialEventDamage.length > 0) {
      for (let i = 0; i < potentialEventDamage.length; i++) {
        const damage = potentialEventDamage[i];
        const damageResponse = await axios
          .post(
            `${tenant}/data/SRF_HSEPotentialEventDamage?cross-company=true&$format=application/json;odata.metadata=none`,
            {
              dataAreaId: eventDetails.dataAreaId,
              SRF_HSEIdUnsafeCondition: eventDetails.SRF_HSEIdUnsafeCondition,
              RefRecid: eventDetails.RecId1,
              ...damage,
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
        _potentialEventDamage.push(damageResponse.data);
      }
    }

    return res.json({
      result: true,
      message: "OK",
      _unsafeCondition,
      _improvementOpportunity,
      _eventDetails,
      _deleteEventCauses,
      _eventCauses,
      _deletePotentialEventDamage,
      _potentialEventDamage,
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
