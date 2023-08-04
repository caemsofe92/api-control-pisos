let express = require("express");
let router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret = req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const InsertTareas = req.query.InsertTareas || (req.body && req.body.InsertTareas);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!InsertTareas || InsertTareas.length === 0) throw new Error("InsertTareas is Mandatory");

    let token;

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
    }
    
    let _InsertTareas = await axios
    .post(
      `${tenant}/data/TareasControlTareas?$format=application/json;odata.metadata=none&cross-company=true`,
      InsertTareas,
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
    _InsertTareas = _InsertTareas.data;

    return res.json({
        result: true,
        message: "OK",
        _InsertTareas
      });
  
      } 
    catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
