let express = require("express");
const moment = require("moment");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");
const { createLogger, format } = require("winston");
const { winstonAzureBlob, extensions } = require("winston-azure-blob");

const { combine, timestamp, label } = format;

const myFormat = format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "transaction-log" }), timestamp(), myFormat),
  level: "info",
  transports: [
    winstonAzureBlob({
      account: {
        name: "multitenantappsstorage",
        key: "dUEqKBrzMOB0qzOSZMADxP4ywLWJnmTh4s2ar5hh3yhkKmlgaQUlsIDmdB89EMG00fCu2lIIYFiJYfpjZ3duJQ==",
      },
      blobName: "transaction-log",
      bufferLogSize: 1,
      containerName: "nav-transactions-logs",
      eol: "\n",
      extension: extensions.LOG,
      level: "info",
      rotatePeriod: "YYYY-MM-DD",
      syncTimeout: 0,
    }),
  ],
});

const apiURL =
  "http://cooltrack-api.politecoast-9b114af7.eastus2.azurecontainerapps.io/v1/graphql";

const getOrderTable = async (variables) => {
  const options = {
    method: "POST",
    headers: { "x-hasura-admin-secret": "Srf2020***" },
    data: {
      query: `
              query GET_ORDER_TABLE($orderTableId: uuid!, $userId: uuid!) {
                ordersTable (where: {id: {_eq: $orderTableId}}) {
                  orderNumber
                  consecutiveBill
                  consecutiveSaleOrder
                  externalInvoiceId
                  externalSalesId
              }
                users(where: {id: {_eq: $userId}}){
                  displayName
                }
              }`,
      variables,
    },
    url: apiURL,
  };

  const fetchResponse = await axios(options);
  return fetchResponse.data;
};

const getEvidences = async (variables) => {
  const options = {
    method: "POST",
    headers: { "x-hasura-admin-secret": "Srf2020***" },
    data: JSON.stringify({
      query: `
        query getEvidences($ordersTableId: uuid!){
          evidences(where: {ordersTableId: {_eq: $ordersTableId}}){
            evidenceURL
            evidenceType
            id
          }
        }`,
      variables,
    }),
    url: apiURL,
  };

  const fetchResponse = await axios(options);
  return fetchResponse.data;
};

router.post("/", async (req, res) => {
  const transaction = req.body.event.data;

  const tenantUrl = "navitrans.com.co";
  const clientId = "97a8cc5c-65a7-40ac-b1b8-4c9f50e2bc3b";
  const clientSecret = "31n8Q~rvYbbRtLqcEhmOob5zhHQPCjQO4611jcZ7";
  const tenant = "https://uat4-navitrans.sandbox.operations.dynamics.com";
  const environment = "UAT4";

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

  const orderData = await getOrderTable({
    orderTableId: transaction.new.orderTableId,
    userId: transaction.new.userId,
  });

  const order = orderData.data;

  if (order.ordersTable.length > 0) {
    const orderNumber = order.ordersTable[0].orderNumber;
    const consecutiveBill = order.ordersTable[0].consecutiveBill;
    const consecutiveSaleOrder = order.ordersTable[0].consecutiveSaleOrder;
    const externalInvoiceId = order.ordersTable[0].externalInvoiceId;
    const externalSalesId = order.ordersTable[0].externalSalesId;

    if (consecutiveBill?.length > 0 && consecutiveSaleOrder?.length > 0) {
      await axios.post(
        `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetInvoiceHeader`,
        {
          _NAVPackingControlRecipientCode: transaction.new.receivedDocument,
          _NAVPackingControlRecipientDateTime2: moment(
            transaction.new.endDateTime
          )
            .add(5, "hours")
            .format("YYYY/MM/DD HH:mm:ss"),
          _NAVPackingControlRecipientName: transaction.new.receivedPerson,
          _NAVPackingControlCollectionDate: moment(
            transaction.new.created_at
          ).format("YYYY/MM/DD"),
          _NAVPackingControlPaymentMethod: `Entrega en sitio (${orderNumber})`,
          _invoiceId: consecutiveBill,
          _salesId: consecutiveSaleOrder,
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      let evidences = await getEvidences({
        ordersTableId: transaction.new.orderTableId,
      });

      let evidencesList = evidences?.data?.evidences;

      let breakCount = 0;

      while (evidencesList?.length === 0 && breakCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        evidences = await getEvidences({
          ordersTableId: transaction.new.orderTableId,
        });
        evidencesList = evidences?.data?.evidences;
        breakCount++;
      }

      if (evidencesList && evidencesList.length > 0) {
        for (let i = 0; i < evidencesList.length; i++) {
          const element = evidencesList[i];

          const imageRequestName2 =
            element.evidenceType +
            "_" +
            element.id +
            "." +
            element.evidenceURL.split(".")[
              element.evidenceURL.split(".").length - 1
            ];

            /*
          const docuRefEvidences2 = await axios.get(
            `${tenant}/data/SRF_DocuRef?$filter=RefTableId eq 2905 and RefRecId eq ${parseInt(
              externalSalesId
            )} and Name eq '${imageRequestName2}'`,
            { headers: { Authorization: "Bearer " + token } }
          );
        */
        //  if (docuRefEvidences2.data.value.length === 0) {
            const imageRequest2 = {
              _DataareaId: "navi", //UAT UAT3
              //_DataareaId: "navt", //DEV
              _AccesInformation: element.evidenceURL,
              _name: imageRequestName2,
              _TableId: 2905, //DEV UAT UAT3
              _RefRecId: parseInt(externalSalesId),
              _FileType:
                element.evidenceURL.split(".")[
                  element.evidenceURL.split(".").length - 1
                ],
            };

            await axios
              .post(
                `${tenant}/api/services/NAVDocuRefServices/NAVDocuRefService/FillDocuRef`,
                imageRequest2,
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
         // }

          const imageRequestName3 =
            element.evidenceType +
            "_" +
            element.id +
            "." +
            element.evidenceURL.split(".")[
              element.evidenceURL.split(".").length - 1
            ];

        /*  const docuRefEvidences3 = await axios.get(
            `${tenant}/data/SRF_DocuRef?$filter=RefTableId eq 6597 and RefRecId eq ${parseInt(
              externalInvoiceId
            )} and Name eq '${imageRequestName3}'`,
            { headers: { Authorization: "Bearer " + token } }
          );
        */
        //  if (docuRefEvidences3.data.value.length === 0) {
            const imageRequest3 = {
              _DataareaId: "navi", //UAT UAT3
              //_DataareaId: "navt", //DEV
              _AccesInformation: element.evidenceURL,
              _name: imageRequestName3,
              _TableId: 6597, //DEV UAT UAT3
              _RefRecId: parseInt(externalInvoiceId),
              _FileType:
                element.evidenceURL.split(".")[
                  element.evidenceURL.split(".").length - 1
                ],
            };

            await axios
              .post(
                `${tenant}/api/services/NAVDocuRefServices/NAVDocuRefService/FillDocuRef`,
                imageRequest3,
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
          //}
        }
      }

      res.send("OK");
    } else {
      res.status(400).json({
        result: false,
        message: "The order does not meet the required conditions",
      });
    }
  } else {
    res.status(404).json({
      result: false,
      message: "Order not found",
    });
  }
});

module.exports = router;
