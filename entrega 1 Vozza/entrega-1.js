let productos = [];
let total = 0;

function ejecutarCompra() {
  function ingresarProductos() {
    let cantidad = parseInt(prompt("¿Cuántos productos desea llevar?"));
    for (let i = 0; i < cantidad; i++) {
      let nombre = prompt(`Ingrese el nombre del producto: ${i + 1}`);
      let precio = parseFloat(prompt(`Ingrese el precio de ${nombre}:`));
      productos.push({ nombre, precio });
      total += precio;
    }
  }

  function calcularTotalconIVA() {
    const IVA = 0.21;
    return total * (1 + IVA);
  }

  function mostrarResumen() {
    let resumen = "resumen de compra:\n\n";
    productos.forEach((productos, index) => {
      resumen += `${index + 1}. ${productos.nombre} - $${productos.precio}\n`;
    });

    let costoEnvio = 0;
    if (confirm("¿desea agregar costo de envío por 100$?")) {
      costoEnvio = 100;
      resumen += `\nIncluye envío: Sí\n`;
    } else {
      resumen += "\nIncluye envío: No\n";
    }

    let totalFinal = calcularTotalconIVA() + costoEnvio;
    resumen += `\nTotal con IVA: $${calcularTotalconIVA().toFixed(2)}\n`;
    resumen += `Costo de envío: $${costoEnvio}\n`;
    resumen += `\n Total Final: $${totalFinal.toFixed(2)}\n`;

    alert(resumen);
    console.log(resumen);
  }

  ingresarProductos();
  mostrarResumen();
}
