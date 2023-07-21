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
        routes(order_by: {endDateTime: desc}, where: {batch: { _eq: $batch }}) {
                id
                status
                user {
                    id
                    userVehicle{
                        id
                        hasAssignedRoute
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

    if(transaction.new.status === "delivered" ||
      transaction.new.status === "undelivered" ||
      transaction.new.status === "partial_delivered" ||
      transaction.new.status === "rescheduled_delivery"){
        const routesData = await getRoutes({
          batch: transaction.new.batch
        });
        let allComplete = true;
        let userVehicle;
        const routes = routesData.data; 

        for (let i = 0; i < routes.routes.length; i++) {
          const element = routes.routes[i];
          if(element.status === "delivered" ||
          element.status === "undelivered" ||
          element.status === "partial_delivered" ||
          element.status === "rescheduled_delivery"){
            userVehicle = element.user.userVehicle;
          }else{
            allComplete = false;
            break;
          }
        }
        if(allComplete === true && userVehicle?.hasAssignedRoute === true){
          await updateUser({id: userVehicle.id})
        }
    }
    res.send("OK")
});

module.exports = router;