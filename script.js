const productos = [
  { id: 1, nombre: "Panel solar 600W", precio: 120.00, categoria: "paneles", imagen: "https://cdn.enfsolar.com/Product/logo/Crystalline/65a9d7ed0ba1e.jpg" },
  { id: 2, nombre: "Inversor Fotovoltaico GoodWe", precio: 250.00, categoria: "inversores", imagen: "https://es.goodwe.com/ueditor/php/upload/image/20181025/1540437797869715.png" },
  { id: 3, nombre: "Batería de litio GoodWe", precio: 450.00, categoria: "baterias", imagen: "https://es.goodwe.com/Public/Uploads/uploadfile11/images/20231226/Lynx-U%E4%BA%8C%E4%BB%A3%E6%9C%BA-2-964.png" },
  { id: 4, nombre: "Generador eólico", precio: 1000.00, categoria: "generadores", imagen: "https://www.comvalia.com/wp-content/uploads/2022/03/H0382d829acc9442db6d5b88733296dd4Z.jpg" },
  { id: 5, nombre: "Medidor de energia bidireccional", precio: 90.00, categoria: "Medidores", imagen: "https://ineldec.com/wp-content/uploads/2024/08/Medidor-bidireccional-contador-bidireccional-iskra-trifasico-1.png" },
  { id: 6, nombre: "Conectores MC4", precio: 1.00, categoria: "Accesorios", imagen: "https://ferrelam.com/cdn/shop/files/MC4.jpg?v=1701782348" }
];

let carrito = new Map();

const contenedorProductos = document.getElementById("productos");
const listaCarrito = document.getElementById("lista-carrito");
const totalCarrito = document.getElementById("total");
const cantidadCarrito = document.getElementById("cantidad-carrito");
const contenedorPayPal = document.getElementById("paypal-button-container");

function mostrarProductos(lista) {
  contenedorProductos.innerHTML = "";
  lista.length === 0
    ? contenedorProductos.innerHTML = "<p>No hay productos para esta categoría.</p>"
    : lista.forEach(prod => {
        const div = document.createElement("div");
        div.className = "producto";
        div.innerHTML = `
          <img src="${prod.imagen}" alt="${prod.nombre}">
          <h3>${prod.nombre}</h3>
          <p>Precio: $${prod.precio.toFixed(2)}</p>
          <button onclick="agregarAlCarrito(${prod.id})">Agregar al carrito</button>
        `;
        contenedorProductos.appendChild(div);
      });
}

function filtrarPorCategoria() {
  const categoria = document.getElementById("categoria").value;
  const filtrados = categoria === "todos" ? productos : productos.filter(p => p.categoria === categoria);
  mostrarProductos(filtrados);
}

function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  if (carrito.has(id)) {
    carrito.get(id).cantidad++;
  } else {
    carrito.set(id, { ...producto, cantidad: 1 });
  }

  guardarCarrito();
  actualizarCarrito();
}

function eliminarDelCarrito(id) {
  if (!carrito.has(id)) return;
  const item = carrito.get(id);
  item.cantidad > 1 ? item.cantidad-- : carrito.delete(id);
  guardarCarrito();
  actualizarCarrito();
}

function vaciarCarrito() {
  if (carrito.size === 0) return;
  if (confirm("¿Deseas vaciar el carrito?")) {
    carrito.clear();
    guardarCarrito();
    actualizarCarrito();
  }
}

function finalizarCompra() {
  if (carrito.size === 0) return alert("Tu carrito está vacío.");
  alert("¡Gracias por tu compra! Procesando pedido...");
  vaciarCarrito();
}

function actualizarCarrito() {
  listaCarrito.innerHTML = "";
  let total = 0;
  let cantidad = 0;

  carrito.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `${item.nombre} - $${item.precio.toFixed(2)} x ${item.cantidad}
    <button onclick="eliminarDelCarrito(${item.id})">❌</button>`;
    listaCarrito.appendChild(li);
    total += item.precio * item.cantidad;
    cantidad += item.cantidad;
  });

  totalCarrito.textContent = total.toFixed(2);
  cantidadCarrito.textContent = cantidad;
  contenedorPayPal.style.display = carrito.size > 0 ? "block" : "none";
}

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(Array.from(carrito.entries())));
}

function cargarCarrito() {
  const data = localStorage.getItem("carrito");
  if (data) {
    carrito = new Map(JSON.parse(data));
    actualizarCarrito();
  }
}

// PayPal
if (window.paypal) {
  paypal.Buttons({
    createOrder: function (data, actions) {
      const total = Array.from(carrito.values()).reduce((acc, item) => acc + item.precio * item.cantidad, 0);
      return actions.order.create({
        purchase_units: [{ amount: { value: total.toFixed(2) } }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(details => {
        alert(`¡Gracias ${details.payer.name.given_name}, tu pago fue exitoso!`);
        vaciarCarrito();
      });
    },
    onError: function (err) {
      console.error("Error con PayPal:", err);
      alert("Error con el pago. Inténtalo de nuevo.");
    }
  }).render("#paypal-button-container");
}

// Exportar PDF
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Carrito de Compras", 10, 10);

  let y = 20;
  carrito.forEach(item => {
    doc.text(`${item.nombre} - $${item.precio.toFixed(2)} x ${item.cantidad}`, 10, y);
    y += 10;
  });

  doc.text(`Total: $${totalCarrito.textContent}`, 10, y + 10);
  doc.save("carrito.pdf");
}

// Exportar Excel (CSV)
function exportarExcel() {
  let csv = "Nombre,Precio,Cantidad\n";
  carrito.forEach(item => {
    csv += `${item.nombre},${item.precio},${item.cantidad}\n`;
  });
  csv += `Total,${totalCarrito.textContent},\n`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "carrito.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// Inicializar
filtrarPorCategoria();
cargarCarrito();

// Inicialización
filtrarPorCategoria();
cargarCarrito();
