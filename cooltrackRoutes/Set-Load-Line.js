let express = require("express");
let router = express.Router();
const client = require("../bin/redis-client");
const axios = require("axios");

router.post("/", async (req, res) => {
  
  const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
  const clientId = req.query.clientId || (req.body && req.body.clientId);
  const clientSecret =
    req.query.clientSecret || (req.body && req.body.clientSecret);
  const tenant = req.query.tenant || (req.body && req.body.tenant);
  const entity = req.query.entity || (req.body && req.body.entity);
  const userCompany =
    req.query.userCompany || (req.body && req.body.userCompany);
  const environment =
    req.query.environment || (req.body && req.body.environment);
    const setLoadLine =
      req.query.setLoadLine || (req.body && req.body.setLoadLine);
      if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!entity || entity.length === 0) throw new Error("entity is Mandatory");

    if (!userCompany || userCompany.length === 0)
      throw new Error("userCompany is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!setLoadLine || setLoadLine.length === 0)
      throw new Error("setLoadLine is Mandatory");

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

    let _setLoadLine = await axios
      .post(
        `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFSetLoadLine?$format=application/json;odata.metadata=none`,
        {
          _NAVPackingControlCollectionDate: setLoadLine._NAVPackingControlCollectionDate,
          _NAVPackingControlDeliveredCode:setLoadLine._NAVPackingControlDeliveredCode,
          _NAVPackingControlDeliveredTo:setLoadLine._NAVPackingControlDeliveredTo,
          _NAVPackingControlRecipientCode:setLoadLine._NAVPackingControlRecipientCode,
          _NAVPackingControlRecipientDateTime2:setLoadLine._NAVPackingControlRecipientDateTime2,
          _NAVPackingControlRecipientName:setLoadLine._NAVPackingControlRecipientName,
          _loadId:setLoadLine._loadId,
          _shipmentId:setLoadLine._shipmentId,
          _salesId:setLoadLine._salesId,
          _itemId:setLoadLine._itemId
        },
        { headers: { Authorization: "Bearer " + token } }
      )
      .catch(function (error) {
        console.log(error)
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

      _setLoadLine = _setLoadLine.data;

    return res.json({
      result: true,
      message: "OK",
      _setLoadLine
    });
    
    try {} catch (error) {
    return res.status(500).json({ result: false, message: error.toString() });
  }
});

module.exports = router;