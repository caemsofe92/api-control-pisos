let express = require("express");
const moment = require("moment");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

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
                  paymentMethod
                  consecutiveBurden
                  consecutiveShipping
                  consecutiveSaleOrder
                  ordersLines {
                    productName
                    productNumber
                    orderedQuantity
                    deliveredQuantity
                    summationQuantity
                    externalId
                    externalInvoiceId
                    externalSalesId
                    Invoice
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

router.post("/", async (req, res) => {
  const transaction = req.body.event.data;
  let step = 0;

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
    const consecutiveBurden = order.ordersTable[0].consecutiveBurden;
    const consecutiveShipping = order.ordersTable[0].consecutiveShipping;
    const consecutiveSaleOrder = order.ordersTable[0].consecutiveSaleOrder;
    const ordersLines = order.ordersTable[0].ordersLines;
    const courier = order.users[0].displayName;

    if (
      transaction.old.status === null &&
      transaction.new.status === "none"
    ) {
      step = 1;

      if (
        consecutiveBurden?.length > 0 &&
        consecutiveShipping?.length > 0 &&
        consecutiveSaleOrder?.length > 0
      ) {
        const deliveryHeaderData = {
          loadId: consecutiveBurden,
          collectionDate: moment(transaction.new.updatedAt).format(
            "YYYY/MM/DD"
          ),
          deliveredOrderNumber: orderNumber,
          deliveredTo: courier,
        };

        await axios.post(
          `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetLoadHeader`,
          {
            _NAVPackingControlCollectionDate: deliveryHeaderData.collectionDate,
            _NAVPackingControlDeliveredCode:
              deliveryHeaderData.deliveredOrderNumber,
            _NAVPackingControlDeliveredTo: deliveryHeaderData.deliveredTo,
            _loadId: deliveryHeaderData.loadId,
          },
          { headers: { Authorization: "Bearer " + token } }
        );

        if (ordersLines.length > 0) {
          for (let i = 0; i < ordersLines.length; i++) {
            const orderLine = ordersLines[i];

            const deliveryData = {
              loadId: deliveryHeaderData.loadId,
              collectionDate: deliveryHeaderData.collectionDate,
              deliveredOrderNumber: deliveryHeaderData.deliveredOrderNumber,
              deliveredTo: deliveryHeaderData.deliveredTo,
              shipmentId: consecutiveShipping,
              salesId: consecutiveSaleOrder,
              itemId: orderLine.productNumber,
              summationQuantity: orderLine.summationQuantity,
            };

            await axios.post(
              `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetLoadLine`,
              {
                _NAVPackingControlCollectionDate: deliveryData.collectionDate,
                _NAVPackingControlDeliveredCode:
                  deliveryData.deliveredOrderNumber,
                _NAVPackingControlDeliveredTo: deliveryData.deliveredTo,
                _NAVPackingControlRecipientCode: "",
                _NAVPackingControlRecipientDateTime2: "",
                _NAVPackingControlRecipientName: "",
                _NAVPackingControlDeliveredStatus: "Despachado",
                _NAVPackingControlDeliveredQty: deliveryData.summationQuantity,
                _loadId: deliveryData.loadId,
                _shipmentId: deliveryData.shipmentId,
                _salesId: deliveryData.salesId,
                _itemId: deliveryData.itemId,
              },
              { headers: { Authorization: "Bearer " + token } }
            );
          }
        }

        res.send("OK");
      } else {
        res.status(400).json({
          result: false,
          message: "The order does not meet the required conditions",
        });
      }
    }
}
});

module.exports = router;
