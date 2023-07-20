let express = require("express");
let router = express.Router();
const axios = require("axios");

const apiURL =
  "https://cooltrack-api.politecoast-9b114af7.eastus2.azurecontainerapps.io/v1/graphql";

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
                user {
                    displayName
                    identificationNumber
                    phoneNumber
                    userVehicle{
                        id
                    }
                }
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
const updateUser = async (variables) => {
  const options = {
    method: "POST",
    headers: { "x-hasura-admin-secret": "Srf2020***" },
    data: JSON.stringify({
      query: `
      mutation updateUserVehicle($id: uuid!) {
        update_userVehicle(_set: {hasAssignedRoute: false}, where: {id: {_eq: $id}}) {
            affected_rows
            returning {
                id
            }
        }
    }
      `,
      variables,
    }),
    url: apiURL,
  };
  const fetchResponse = await axios(options);
  return fetchResponse.data;
}
router.post("/", async (req, res) => {
    const transaction = req.body.event.data;
    console.log(transaction);
    const orderData = await getRoutes({
        batch: transaction.new.batch,
      });
    
      const order = orderData.data;   
  if (order.routes.length > 0) {    
      for (let i = 0; i < order.length; i++) {
        const element = order[i];
        if(element.routes.status != "none" || element.routes.status != "started"){
          const variable= element.routes?.user?.userVehicle?.id;
          updateUser(variable);
        }
      }
  }else {
    res.status(404).json({
    result: false,
    message: "routes not found",
      });
    }
});

module.exports = router;