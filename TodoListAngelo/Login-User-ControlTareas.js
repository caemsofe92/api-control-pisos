let express = require("express");
let router = express = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => { 

    try{
        const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
        const clientId = req.query.clientId || (req.body && req.body.clientId);
        const clientSecret = req.query.clientSecret || (req.body && req.body.clientSecret);
        const tenant = req.query.tenant || (req.body && req.body.tenant);
        const LoginUsuarios = req.query.LoginUsuarios || (req.body && req.body.LoginUsuarios);

        if(!tenantUrl || tenantUrl.length === 0)
        {
            throw new Error("tenantUrl is Mandatory");
        }
        if(!clientId || clientId.length === 0)
        {
            throw new Error("clientId is Mandatory");
        }
        if(!clientSecret || clientSecret.length === 0)
        {
            throw new Error("clientSecret is Mandatory");
        }
        if(!tenant || tenant.length === 0)
        {
            throw new Error("tenant is Mandatory");
        }
        if(!LoginUsuarios || LoginUsuarios.length === 0)
        {
            throw new Error("LoginUsuarios is Mandatory");
        }

        let token;

        if(!token){
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

        let _LoginUsuarios = await axios
        .post(
            `${tenant}/api/services/ServiceGroupGonzalo/ServiceGonzalo/SRFSelectDeviceCustodianJour?$format=application/json;odata.metadata=none&cross-company=true`,
            LoginUsuarios,
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
          _LoginUsuarios = _LoginUsuarios.data;

          return res.json({
            result: true,
            message: "OK",
            _LoginUsuarios
          });
    }
    catch (error)
    {
        return res.status(500).json({
            result: false,
            message: error.toString(),
        });
    }
})

module.exports = router;