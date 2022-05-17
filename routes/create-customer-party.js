let express = require("express");
let router = express.Router();
const axios = require("axios");
const client = require("../bin/redis-client");
const moment = require("moment");
const { BlobServiceClient } = require("@azure/storage-blob");
require('moment/locale/es');

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const environment =
      req.query.environment || (req.body && req.body.environment);
    const customerData =
      req.query.customerData || (req.body && req.body.customerData);
    const email =
      req.query.email || (req.body && req.body.email);
      
    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

    if (!customerData || customerData.length === 0)
      throw new Error("customerData is Mandatory");

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

    let _customerData = await axios
      .post(
        `${tenant}/api/services/SRF_ServiceCenterControlServices/SRF_ServiceCenterControlService/SRFCreateDirPartyTable`,
          customerData,
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

    _customerData = _customerData.data;
    
    if (email) {
      const message = `<div><p>Señores</p><p>Cordial saludo;</p><p>Se ha soliciado la creación de un nuevo cliente desde la aplicación, relacionamos la información digilenciada:</p> <br/> <p>Identificación: ${customerData.identificationNumber}</p> <p>Nombre o Razón social: ${customerData.name}</p> <p>Teléfono: ${customerData.phone}</p> <p>Correo Electrónico: ${customerData.email}</p> <p>Id de la Parte: ${_customerData}</p> <br/> <p>Gracias.</p></div>`;
      await axios
        .post(
          process.env.EMAILNOTIFICATIONURL,
          {
            recipients: !email.recipients || email.recipients === "" ? process.env.DEVELOPEREMAIL : email.recipients,
            message,
            messageTeams: message,
            subject: `Solicitud creación de cliente - Control de Pisos`,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
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
    }

    return res.json({
      result: true,
      message: "OK",
      _customerData
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
