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
                  consecutiveBurden
                  consecutiveShipping
                  consecutiveSaleOrder
                  ordersLines {
                    productName
                    productNumber
                    orderedQuantity
                    deliveredQuantity
                    externalId
                  }
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

  if (
    transaction.new.status !== "delivered" &&
    transaction.new.status !== "undelivered" &&
    transaction.new.status !== "partial_delivered" &&
    transaction.new.status !== "rescheduled_delivery"
  ) {
    return res.status(200).send("Transaction already processed");
  }

  const tenantUrl = "navitrans.com.co";
  const clientId = "97a8cc5c-65a7-40ac-b1b8-4c9f50e2bc3b";
  const clientSecret = "31n8Q~rvYbbRtLqcEhmOob5zhHQPCjQO4611jcZ7";
  const tenant = "https://uat-navitrans.sandbox.operations.dynamics.com";
  const environment = "UAT";

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
    const consecutiveBurden = order.ordersTable[0].consecutiveBurden;
    const consecutiveShipping = order.ordersTable[0].consecutiveShipping;
    const consecutiveSaleOrder = order.ordersTable[0].consecutiveSaleOrder;
    const ordersLines = order.ordersTable[0].ordersLines;
    const courier = order.users[0].displayName;

    if (
      consecutiveBurden?.length > 0 &&
      consecutiveShipping?.length > 0 &&
      ordersLines.length > 0 &&
      transaction.new?.endDateTime
    ) {
      const responses = [];

      await ordersLines.forEach(async (orderLine, index) => {
        const deliveryData = {
          loadId: consecutiveBurden,
          shipmentId: consecutiveShipping,
          salesId: consecutiveSaleOrder,
          itemId: orderLine.productNumber,
          collectionDate: moment(transaction.new.startDateTime).format(
            "YYYY/MM/DD"
          ),
          deliveredOrderNumber: orderNumber,
          deliveredTo: courier,
          recipientDocument: transaction.new.receivedDocument,
          recipientDateTime: moment(transaction.new.endDateTime)
            .add(5, "hours")
            .format("YYYY/MM/DD HH:mm:ss"),
          recipientName: transaction.new.receivedPerson,
          deliveredQuantity: orderLine.deliveredQuantity,
          orderedQuantity: orderLine.orderedQuantity,
        };

        let statusNew = "";

        switch (transaction.new.status) {
          case "delivered":
            statusNew = "Entregado";
            break;
          case "undelivered":
            statusNew = "No entregado";
            break;
          case "partial_delivered":
            statusNew = `Entrega parcial (${deliveryData.deliveredQuantity} de ${deliveryData.orderedQuantity})`;
            break;
          case "rescheduled_delivery":
            statusNew = "Entrega reprogramada";
            break;
          default:
        }

        let _deliveryData = await axios.post(
          `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetLoadLine`,
          {
            _NAVPackingControlCollectionDate: deliveryData.collectionDate,
            _NAVPackingControlDeliveredCode: deliveryData.deliveredOrderNumber,
            _NAVPackingControlDeliveredTo: `${deliveryData.deliveredTo} - ${statusNew}`,
            _NAVPackingControlRecipientCode: deliveryData.recipientDocument,
            _NAVPackingControlRecipientDateTime2:
              deliveryData.recipientDateTime,
            _NAVPackingControlRecipientName: deliveryData.recipientName,
            _loadId: deliveryData.loadId,
            _shipmentId: deliveryData.shipmentId,
            _salesId: deliveryData.salesId,
            _itemId: deliveryData.itemId,
          },
          { headers: { Authorization: "Bearer " + token } }
        );

        _deliveryData = _deliveryData.data;

        responses.push({
          itemId: deliveryData.itemId,
          response: _deliveryData,
        });
      });

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

      let _evidences = [];

      if (evidencesList && evidencesList.length > 0) {
        for (let i = 0; i < evidencesList.length; i++) {
          const element = evidencesList[i];

          const imageRequest = {
            //_DataareaId: "navi", //UAT
            _DataareaId: "navt", //DEV
            _AccesInformation: element.evidenceURL,
            _name:
              element.evidenceType +
              "_" +
              element.id +
              "." +
              element.evidenceURL.split(".")[3],
            //_TableId: 7309, //UAT
            _TableId: 7312, //DEV
            _RefRecId: parseInt(ordersLines[0].externalId),
            _FileType: element.evidenceURL.split(".")[3],
          };

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
            RefRecId: ordersLines[0].externalId,
            OriginalFileName: element.evidenceType + "_" + element.id,
          });
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
