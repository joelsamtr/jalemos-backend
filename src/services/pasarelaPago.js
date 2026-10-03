// Servicio de cobro con tarjeta. Aísla toda la comunicación con la
// pasarela de pago en un solo lugar: si en el futuro cambias de
// proveedor (Recurrente → Stripe, por ejemplo), solo tocas este archivo.
//
// IMPORTANTE: esta función recibe un TOKEN de un solo uso (generado en
// el navegador del comprador por el SDK de la pasarela), nunca el
// número de tarjeta. Ver nota de seguridad en transacciones.controller.js.

const PAGOS_API_URL = process.env.PAGOS_API_URL;
const PAGOS_API_KEY = process.env.PAGOS_API_KEY;

export async function cobrarConToken({ tokenPago, montoTotal, correoComprador }) {
  if (!PAGOS_API_KEY) {
    throw new Error(
      "La pasarela de pago no está configurada todavía (falta PAGOS_API_KEY en .env)"
    );
  }

  // Ejemplo de la forma típica de este tipo de llamada (ajusta los
  // nombres de campos exactos según la documentación de Recurrente
  // una vez tengas la cuenta activa: https://recurrente.com/docs):
  //
  // const respuesta = await fetch(`${PAGOS_API_URL}/charges`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${PAGOS_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     amount: Math.round(montoTotal * 100), // centavos
  //     currency: "GTQ",
  //     source: tokenPago,
  //     receipt_email: correoComprador,
  //   }),
  // });
  //
  // const datos = await respuesta.json();
  // if (!respuesta.ok) {
  //   return { exitoso: false, error: datos.message };
  // }
  // return { exitoso: true, referencia: datos.id };

  throw new Error(
    "cobrarConToken() todavía no está conectado a una pasarela real. " +
      "Descomenta y ajusta el bloque de ejemplo cuando tengas tus credenciales."
  );
}
