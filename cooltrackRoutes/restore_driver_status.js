let express = require("express");
let router = express.Router();
const axios = require("axios");

const apiURL =
  "http://cooltrack-api.politecoast-9b114af7.eastus2.azurecontainerapps.io/v1/graphql";

const getRoutes = async (variables) => {
  const options = {
    method: "POST",
    headers: { "x-hasura-admin-secret": "Srf2020***" },
    data: {
      query: `
      query fetchCompletedRoutes($batch: uuid!) {
        routesBatch(order_by: {endDateRoute: desc}, where: {batch: { _eq: $batch }}) {
            id
            batch
            createdAt
            startDateRoute
            endDateRoute
            user {
                identificationNumber
                displayName
                distributionCenterId
               userDeliveryCenters{
                distributionCenterId
              }
            }
            licencePlate
            routes(order_by: {endDateTime: desc}) {
                id
                status
                startDateTime
                endDateTime
                userId
                distanceText
                distanceValue
                durationText
                durationValue
                receivedPerson
                receivedDocument
                polylines
                orderTableId
                reasonId
            }
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
    console.log(transaction);
    const orderData = await getRoutes({
        batch: transaction.new.batch,
      });
    
      const order = orderData.data;   
      console.log(order);
});

module.exports = router;