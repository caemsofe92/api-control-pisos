let express = require("express");
const moment = require("moment");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

const apiURL =
  "http://cooltrack-api.politecoast-9b114af7.eastus2.azurecontainerapps.io/v1/graphql";

const getRoutes = async (variables) => {
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
    
});

module.exports = router;