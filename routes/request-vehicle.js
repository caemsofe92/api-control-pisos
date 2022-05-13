let express = require("express");
let router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
   
    const email = req.query.email || (req.body && req.body.email);

    if (!email || email.length === 0)
      throw new Error("email is Mandatory");

    if (email) {
      await axios
        .post(
          process.env.EMAILNOTIFICATIONURL,
          {
            recipients: !email.recipients || email.recipients === "" ? process.env.DEVELOPEREMAIL : email.recipients,
            message: `<div><p>Señores</p><p>Cordial saludo;</p><p>Solicitamos la creación del vehículo ${email.registrationNumber} para la empresa ${email.customerName}, para mayor información por favor comunicase al número ${email.customerPhoneNumber}.</p><p>Gracias</p></div>`,
            subject: `Solicitud creación de vehículo - Control de Pisos`,
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
      message: "OK"
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
