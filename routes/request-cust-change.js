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
              Se ha soliciado el cambio de cliente de un vehículo desde la aplicación, relacionamos la información a continuación:
              <h4>Datos del vehículo:</h4>
              <p>Nombre: ${email.vehicleName ? email.vehicleName : ""}</p>
              <p>ID Maestro: ${email.vehicleMasterId ? email.vehicleMasterId : ""}</p>
              <p>Placa: ${email.vehicleRegistrationNumber ? email.vehicleRegistrationNumber : ""}</p>
              <p>VIN: ${email.vehicleVIN ? email.vehicleVIN : ""}</p>
              <br/>
              <h4>Datos del cliente actual:</h4>
              <p>Nombre o Razón Social: ${email.currentCustomerName ? email.currentCustomerName : ""}</p>
              <p>Cuenta del cliente: ${email.currentCustomerAccountNumber ? email.currentCustomerAccountNumber : ""}</p>
              <p>Cédula o NIT: ${email.currentCustomerIdentificationNumber ? email.currentCustomerIdentificationNumber : ""}</p>
              <p>Persona de Contacto: ${email.currentCustomerContactName ? email.currentCustomerContactName : ""}</p>
              <p>Correo Electrónico: ${email.currentCustomerEmail ? email.currentCustomerEmail : ""}</p>
              <p>Número de Contacto: ${email.currentCustomerPhoneNumber ? email.currentCustomerPhoneNumber : ""}</p>
              <br/>
              <h4>Datos del nuevo cliente:</h4>
              <p>Nombre o Razón Social: ${email.newCustomerName ? email.newCustomerName : ""}</p>
              <p>Cédula o NIT: ${email.newCustomerIdentificationNumber ? email.newCustomerIdentificationNumber : ""}</p>
              <p>Persona de Contacto: ${email.newCustomerContactName ? email.newCustomerContactName : ""}</p>
              <p>Correo Electrónico: ${email.newCustomerEmail ? email.newCustomerEmail : ""}</p>
              <p>Número de Contacto: ${email.newCustomerPhoneNumber ? email.newCustomerPhoneNumber : ""}</p>
            </p>
            <br>
            <p>Gracias.</p>
          </div>
          `,
          messageTeams: `<div>
            <p>
              Se ha soliciado el cambio de cliente de un vehículo desde la aplicación, relacionamos la información a continuación:
              <h5>Datos del vehículo:</h5>
              <p>Nombre: ${email.vehicleName ? email.vehicleName : ""}</p>
              <p>ID Maestro: ${email.vehicleMasterId ? email.vehicleMasterId : ""}</p>
              <p>Placa: ${email.vehicleRegistrationNumber ? email.vehicleRegistrationNumber : ""}</p>
              <p>VIN: ${email.vehicleVIN ? email.vehicleVIN : ""}</p>
              <br/>
              <h5>Datos del cliente actual:</h5>
              <p>Nombre o Razón Social: ${email.currentCustomerName ? email.currentCustomerName : ""}</p>
              <p>Cuenta del cliente: ${email.currentCustomerAccountNumber ? email.currentCustomerAccountNumber : ""}</p>
              <p>Cédula o NIT: ${email.currentCustomerIdentificationNumber ? email.currentCustomerIdentificationNumber : ""}</p>
              <p>Persona de Contacto: ${email.currentCustomerContactName ? email.currentCustomerContactName : ""}</p>
              <p>Correo Electrónico: ${email.currentCustomerEmail ? email.currentCustomerEmail : ""}</p>
              <p>Número de Contacto: ${email.currentCustomerPhoneNumber ? email.currentCustomerPhoneNumber : ""}</p>
              <br/>
              <h5>Datos del nuevo cliente:</h5>
              <p>Nombre o Razón Social: ${email.newCustomerName ? email.newCustomerName : ""}</p>
              <p>Cédula o NIT: ${email.newCustomerIdentificationNumber ? email.newCustomerIdentificationNumber : ""}</p>
              <p>Persona de Contacto: ${email.newCustomerContactName ? email.newCustomerContactName : ""}</p>
              <p>Correo Electrónico: ${email.newCustomerEmail ? email.newCustomerEmail : ""}</p>
              <p>Número de Contacto: ${email.newCustomerPhoneNumber ? email.newCustomerPhoneNumber : ""}</p>
            </p>
          </div>
          `,
            subject: `Solicitud cambio de cliente de vehículo - Control de Pisos`,
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
