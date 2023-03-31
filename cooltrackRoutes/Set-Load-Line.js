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
    data: JSON.stringify({
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
                }
            }
              users(where: {id: {_eq: $userId}}){
                displayName
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

  if (req.body.event.op === "UPDATE") {
    const tenantUrl = "navitrans.com.co";
    const clientId = "97a8cc5c-65a7-40ac-b1b8-4c9f50e2bc3b";
    const clientSecret = "31n8Q~rvYbbRtLqcEhmOob5zhHQPCjQO4611jcZ7";
    const tenant = "https://uat3-navitrans.sandbox.operations.dynamics.com";
    const environment = "UAT3";

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
      orderTableId: transaction.old.orderTableId,
      userId: transaction.old.userId,
    });
    const order = orderData.data;

    if (order.ordersTable.length > 0) {
      const orderNumber = order.ordersTable[0].orderNumber;
      const consecutiveBurden = order.ordersTable[0].consecutiveBurden;
      const consecutiveShipping = order.ordersTable[0].consecutiveShipping;
      const consecutiveSaleOrder = order.ordersTable[0].consecutiveSaleOrder;
      const ordersLines = order.ordersTable[0].ordersLines;
      const courier = order.users[0].displayName;
      logger.log(orderNumber, consecutiveBurden, consecutiveShipping, consecutiveSaleOrder, ordersLines, courier);
      if (
        consecutiveBurden &&
        consecutiveShipping &&
        consecutiveSaleOrder &&
        ordersLines.length > 0 &&
        (transaction.new.status === "delivered" ||
          transaction.new.status === "undelivered" ||
          transaction.new.status === "partial_delivered" ||
          transaction.new.status === "rescheduled_delivery")
      ) {
        ordersLines.forEach(async (orderLine) => {
          const deliveryData = {
            loadId: consecutiveBurden,
            shipmentId: consecutiveShipping,
            salesId: consecutiveSaleOrder,
            itemId: orderLine.itemId,
            collectionDate: moment(transaction.new.startDateTime).format(
              "YYYY/MM/DD HH:mm:ss"
            ),
            deliveredOrderNumber: orderNumber,
            deliveredTo: courier,
            recipientDocument: transaction.new.receivedDocument,
            recipientDateTime: moment(transaction.new.endDateTime).format(
              "YYYY/MM/DD HH:mm:ss"
            ),
            recipientName: transaction.new.receivedPerson,
          };

          let _deliveryData = await axios
            .post(
              `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetLoadLine`,
              {
                _NAVPackingControlCollectionDate: deliveryData.collectionDate,
                _NAVPackingControlDeliveredCode:
                  deliveryData.deliveredOrderNumber,
                _NAVPackingControlDeliveredTo: deliveryData.deliveredTo,
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

          _deliveryData = _deliveryData.data;

          logger.info(JSON.stringify(transaction));
          logger.info(JSON.stringify(order));
          logger.info(JSON.stringify(_deliveryData));

          return res.json({
            result: true,
            message: "OK",
            response: _deliveryData,
          });
        });
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
  } else {
    res.status(400).json({
      result: false,
      message: "Invalid operation, only UPDATE operations are supported",
    });
  }
});

module.exports = router;
