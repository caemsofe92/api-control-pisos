let express = require("express");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment = req.query.environment || (req.body && req.body.environment);
    const inventLocationId =[req.query.inventLocationId || (req.body && req.body.inventLocationId)];  
    const pageSize = req.query.pageSize || (req.body && req.body.pageSize);
    const pageId = req.query.pageId || (req.body && req.body.pageId);
    const loadId = req.query.loadId || (req.body && req.body.loadId);
    const isDescending = req.query.isDescending || (req.body && req.body.isDescending);
    const fromDate = req.query.fromDate || (req.body && req.body.fromDate);
    const toDate = req.query.toDate || (req.body && req.body.toDate);
    
    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!inventLocationId || inventLocationId.length === 0)
      throw new Error("inventLocationId is Mandatory");

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
    
    const Entity1 = axios.post(
      `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFGetLoadShipment?$format=application/json;odata.metadata=none`,
      {
        _loadId: loadId,
        _inventLocationId: inventLocationId.toString(),
        _pageSize: pageSize,
        _pageId: pageId,
        _isDescending: isDescending,
        _fromDate: fromDate,
        _toDate: toDate
      },
      { headers: { Authorization: "Bearer " + token } }
    );

    await axios
      .all([Entity1])
      .then(
        axios.spread(async (...responses) => {
          return res.json({
            result: true,
            message: "OK",
            count: responses[0].data[0]?.Count,
            response: responses[0].data,
          });
        })
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
      } catch (error) {
    return res.status(500).json({ result: false, message: error.toString() });
  }
});

module.exports = router;
