let express = require("express");
let router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const email = req.query.email || (req.body && req.body.email);

    if (!email || email.length === 0) throw new Error("email is Mandatory");

    if (email) {
      
      await axios
        .post(
          process.env.EMAILNOTIFICATIONURL,
          {
            recipients:
              !email.recipients || email.recipients === ""
                ? process.env.DEVELOPEREMAIL
                : email.recipients,
            message: `<div>
            <p>Señores</p>
            <p>Cordial saludo;</p>
            <p>
              Se ha soliciado la creación de un nuevo vehículo desde la aplicación, relacionamos la información digilenciada:
              <h4>Datos del vehículo:</h4>
              <p>Placa: ${email.registrationNumber}</p>
              <h4>Cara Frontal Tarjeta de Propiedad</h4>
              <img src="${JSON.parse(email.frontalImage).toString()}" alt="Cara Frontal Tarjeta de Propiedad">
              <h4>Cara Posterior Tarjeta de Propiedad</h4>
              <img src="${JSON.parse(email.posteriorImage).toString()}" alt="Cara Posterior Tarjeta de Propiedad">
              <br>
              <h4>Datos del cliente:</h4>
              <p>Nombre o Razón Social: ${email.customerName}</p>
              <p>Cédula o NIT: ${email.customerIdentificationNumber}</p>
              <p>Teléfono: ${email.customerPhoneNumber}</p>
              <p>Correo Electrónico: ${email.customerEmail}</p>
            </p>
            <br>
            <p>Gracias.</p>
          </div>
          `,
          messageTeams: `<div>
            <p>Señores</p>
            <p>Cordial saludo;</p>
            <p>
              Se ha soliciado la creación de un nuevo vehículo desde la aplicación, relacionamos la información digilenciada:
              <h5>Datos del vehículo:</h5>
              <p>Placa: ${email.registrationNumber}</p>
              <h5>Datos del cliente:</h5>
              <p>Nombre o Razón Social: ${email.customerName}</p>
              <p>Cédula o NIT: ${email.customerIdentificationNumber}</p>
              <p>Teléfono: ${email.customerPhoneNumber}</p>
              <p>Correo Electrónico: ${email.customerEmail}</p>
            </p>
            <br>
            <p>Gracias.</p>
          </div>
          `,
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
      message: "OK",
    });
  } catch (error) {
    return res.status(500).json({
      result: false,
      message: error.toString(),
    });
  }
});

module.exports = router;
