let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const { BlobServiceClient } = require("@azure/storage-blob");
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
    const inspection =
      req.query.inspection || (req.body && req.body.inspection);
    const evidences = req.query.evidences || (req.body && req.body.evidences);
    const inspectionLines =
      req.query.inspectionLines || (req.body && req.body.inspectionLines);

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

    let _inspectionLines = [];

    if (inspectionLines && inspectionLines.length > 0) {
      for (let i = 0; i < inspectionLines.length; i++) {
        const inspectionLine = inspectionLines[i];
        const inspectionResponse = await axios
          .patch(
            `${tenant}/data/SRF_AMInspectionLines(dataAreaId='${inspectionLine.dataAreaId}',RecId1=${inspectionLine.RecId1})?cross-company=true`,
            {
              CheckPass: inspectionLine.CheckPass,
              ChargeCustomer: inspectionLine.ChargeCustomer,
              Comment: inspectionLine.Comment,
              CheckFail: inspectionLine.CheckFail,
              CheckObservation: inspectionLine.CheckObservation,
              Checked: inspectionLine.Checked,
              OnSiteRepair: inspectionLine.OnSiteRepair,
              InspectionValue: inspectionLine.InspectionValue,
              InspectionDateTime: inspectionLine.InspectionDateTime
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
        _inspectionLines.push(inspectionResponse && inspectionResponse.data === ""
        ? "Modified"
        : "Unchanged");
      }
    }

    let _inspection;
    if (inspection) {
    _inspection = await axios
      .patch(
        `${tenant}/data/SRF_InspectionTables(dataAreaId='${inspection.dataAreaId}',InspectionId='${inspection.InspectionId}')?$format=application/json;odata.metadata=none`,
        {
          InspectionStatus: inspection.InspectionStatus,
          InspectionDate: inspection.InspectionDate,
        },
        { headers: { Authorization: "Bearer " + token } }
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

    _inspection = 
    _inspection && _inspection.data === ""
      ? "Modified"
      : "Unchanged";
    }

    let _evidences = [];

    if (evidences) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.BLOBSTORAGECONNECTIONSTRING
      );

      const containerClient = blobServiceClient.getContainerClient(
        process.env.BLOBSTORAGEEVIDENCESPATH
      );

      for (let i = 0; i < evidences.length; i++) {
        const element = evidences[i];

        if (element.imagePath.length > 0) {
          const path = JSON.parse(element.imagePath).toString();

          const matches = path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

          const buffer = new Buffer.from(matches[2], "base64");

          const imageType = matches[1];

          const name =
            inspection.RecId1 +
            moment().format().toString() +
            "sscinspectionimage." +
            imageType.split("/")[1];

          const blockBlobClient = containerClient.getBlockBlobClient(name);

          const responseImage = await blockBlobClient.upload(
            buffer,
            buffer.byteLength
          );

          const imageRequest = {
            _DataareaId: inspection.dataAreaId,
            _AccesInformation: `${process.env.BLOBSTORAGEURL}/${process.env.BLOBSTORAGEEVIDENCESPATH}/${name}`,
            _name: name,
            _TableId: 66416,
            _RefRecId: inspection.RecId1,
            _FileType: imageType.split("/")[1],
          };

          if (responseImage) {
            await axios
              .post(
                `${tenant}/api/services/NAVDocuRefServices/NAVDocuRefService/FillDocuRef`,
                imageRequest,
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
            _evidences.push({
              RefRecId: inspection.RecId1,
              OriginalFileName: name,
            });
          }
        }
      }
    }

    return res.json({
      result: true,
      message: "OK",
      _inspection,
      _evidences,
      _inspectionLines,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
