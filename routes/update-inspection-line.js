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
    const imageEvidences =
      req.query.imageEvidences || (req.body && req.body.imageEvidences);

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

    let _inspectionFaultTrans = [];

    if (inspectionLines && inspectionLines.length > 0) {
      for (let i = 0; i < inspectionLines.length; i++) {
        const inspectionLine = inspectionLines[i];

        if (
          inspectionLine.CheckFail === "Yes" ||
          inspectionLine.CheckObservation === "Yes"
        ) {
          const faultTransResponse = await axios
            .post(
              `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFCreateInspectionFaultTrans`,
              {
                _dataAreaId: inspection.dataAreaId,
                _Description:
                  inspectionLine.CategoryId +
                  ":" +
                  inspectionLine.InspectionValue,
                _DeviceId: inspection.DeviceId,
                _InspectionValue: inspectionLine.InspectionValue,
                _InspectionLine: inspectionLine.RecId1,
                _Severity:
                  inspectionLine.CheckFail === "Yes" ? "Fault" : "Observation",
                _Comment: inspectionLine.Comment,
                _CategoryId: inspectionLine.CategoryId,
                _CaseId: inspection.CaseId,
                _DeviceMasterId: inspection.DeviceMasterId,
                _InspectionId: inspection.InspectionId,
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
          _inspectionFaultTrans.push({
            InspectionLine: inspectionLine.RecId1,
            FaultTransId: faultTransResponse.data,
          });
        }
      }
    }

    let _inspectionLines = [];

    if (inspectionLines && inspectionLines.length > 0) {
      for (let i = 0; i < inspectionLines.length; i++) {
        const inspectionLine = inspectionLines[i];
        //(dataAreaId='${inspection.dataAreaId}',InspectionId='${inspection.InspectionId}',LineNum=${inspectionLine.LineNum},AMInspectionCategory_CategoryId='${encodeURIComponent(inspectionLine.CategoryId)}') InspectionLines
        //(dataAreaId='${inspection.dataAreaId}',RecId1=${inspectionLine.RecId1}) SRF_AMInspectionLines
        const inspectionResponse = await axios
          .post(
            `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFUpdateAMInspectionTable`,
            {
              _RecId1: inspectionLine.RecId1,
              _CheckPass: inspectionLine.CheckPass,
              _ChargeCustomer: inspectionLine.ChargeCustomer,
              _Comment: inspectionLine.Comment,
              _CheckFail: inspectionLine.CheckFail,
              _CheckObservation: inspectionLine.CheckObservation,
              _Checked: inspectionLine.Checked,
              _OnSiteRepair: inspectionLine.OnSiteRepair,
              _InspectionValue: inspectionLine.InspectionValue,
              _InspectionFaultTransId:
                _inspectionFaultTrans.filter(
                  (item) => item.InspectionLine === inspectionLine.RecId1
                ).length > 0
                  ? _inspectionFaultTrans.filter(
                      (item) => item.InspectionLine === inspectionLine.RecId1
                    )[0].FaultTransId
                  : "",
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
        _inspectionLines.push(inspectionResponse.data);
      }
    }

    let _inspection;
    if (inspection) {
      _inspection = await axios
        .post(
          `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFUpdatePostedAMInspectionTable`,
          {
            _InspectionId: inspection.InspectionId,
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

      _inspection = _inspection.data;
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
            "sscinssimage." +
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

    let _imageEvidences = [];

    if (imageEvidences && imageEvidences.length > 0) {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.BLOBSTORAGECONNECTIONSTRING
      );

      const containerClient = blobServiceClient.getContainerClient(
        process.env.BLOBSTORAGEEVIDENCESPATH
      );

      for (let i = 0; i < imageEvidences.length; i++) {
        const element = imageEvidences[i];

        if (element.imagePath.length > 0) {
          const path = JSON.parse(element.imagePath).toString();

          const matches = path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

          const buffer = new Buffer.from(matches[2], "base64");

          const imageType = matches[1];

          const name =
            element.RecId1 +
            moment().format().toString() +
            "sscinsevimage." +
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
            _TableId: 66094,
            _RefRecId: element.RecId1,
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
            _imageEvidences.push({
              RefRecId: element.RecId1,
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
      _inspectionLines,
      _evidences,
      _imageEvidences,
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
