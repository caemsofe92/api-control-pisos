let express = require("express");
let router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const tenantUrl = req.query.tenantUrl || (req.body && req.body.tenantUrl);
    const clientId = req.query.clientId || (req.body && req.body.clientId);
    const clientSecret =
      req.query.clientSecret || (req.body && req.body.clientSecret);
    const tenant = req.query.tenant || (req.body && req.body.tenant);
    const entity = req.query.entity || (req.body && req.body.entity);
    const userEmail = req.query.userEmail || (req.body && req.body.userEmail);
    const environment =
      req.query.environment || (req.body && req.body.environment);

    if (!tenantUrl || tenantUrl.length === 0)
      throw new Error("tenantUrl is Mandatory");

    if (!clientId || clientId.length === 0)
      throw new Error("clientId is Mandatory");

    if (!clientSecret || clientSecret.length === 0)
      throw new Error("clientSecret is Mandatory");

    if (!tenant || tenant.length === 0) throw new Error("tenant is Mandatory");

    if (!entity || entity.length === 0) throw new Error("entity is Mandatory");

    if (!userEmail || userEmail.length === 0)
      throw new Error("userEmail is Mandatory");

    if (!environment || environment.length === 0)
      throw new Error("environment is Mandatory");

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
    let userReply;
    const Entity1 = axios.get(
      `${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name`,
      { headers: { Authorization: "Bearer " + token } }
    );
    const Entity2 = axios.get(
        `${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name`,
        { headers: { Authorization: "Bearer " + token } }
      );
    const Entity3 = axios.get(
        `${tenant}/data/SRFSecurityRoles?$format=application/json;odata.metadata=none&cross-company=true&$filter=Email eq '${userEmail}'&$select=Name`,
        { headers: { Authorization: "Bearer " + token } }
      );
    
    await axios
      .all([Entity1,Entity2,Entity3])
      .then(
        axios.spread(async () => {
        const System_administrator = Entity1.some(item => item.Name === "System administrator");
        const Asesor_de_Servicio = Entity2.some(item => item.Name === "Asesor de Servicio");
        const Tecnico = Entity3.some(item => item.Name === "Técnico"); 
        if(System_administrator === true){
            userReply = "System administrator";
        }else if(Asesor_de_Servicio === true){
            userReply = "Asesor de Servicio";
        }else if(Tecnico === true){
            userReply = "Técnico";
        }     
          return res.json({ result: true, message: "OK", response: userReply });
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
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
