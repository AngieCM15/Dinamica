const KEY_JUGADORES = "POZITO_REGALON_2026_JUGADORES_V1";
const KEY_RESUMEN = "POZITO_REGALON_2026_RESUMEN_V1";
const KEY_RULETA = "POZITO_REGALON_2026_RULETA_V1";

let jugadores = [];

try {
    jugadores = JSON.parse(localStorage.getItem(KEY_JUGADORES)) || [];
    if (!Array.isArray(jugadores)) jugadores = [];
} catch {
    jugadores = [];
}

const inicio = new Date(2026, 10, 3);
const fin = new Date(2026, 11, 2);
let fechas = [];

function generarFechas() {
    fechas = [];
    let fecha = new Date(inicio);

    while (fecha <= fin) {
        fechas.push(fecha.toLocaleDateString("es-ES"));
        fecha.setDate(fecha.getDate() + 1);
    }
}

function guardar() {
    localStorage.setItem(KEY_JUGADORES, JSON.stringify(jugadores));
}

function calcularTotal(jugador) {
    return Object.values(jugador.puntos || {})
        .reduce((total, puntos) => total + (Number(puntos) || 0), 0);
}

function actualizarReloj() {
    const ahora = new Date();
    const fecha = document.getElementById("fechaActual");
    const hora = document.getElementById("horaActual");

    if (fecha) fecha.textContent = "📅 " + ahora.toLocaleDateString("es-ES");
    if (hora) hora.textContent = "🕒 " + ahora.toLocaleTimeString("es-ES");
}

setInterval(actualizarReloj, 1000);

function actualizarEstadisticas() {
    const cantidad = document.getElementById("cantidadJugadores");
    const lider = document.getElementById("liderActual");
    const puntos = document.getElementById("puntosTotales");
    const promedio = document.getElementById("promedioPuntos");

    if (!cantidad) return;

    cantidad.textContent = jugadores.length;

    let totalGeneral = 0;
    let mayor = -1;
    let mejor = "-";

    jugadores.forEach(jugador => {
        const total = calcularTotal(jugador);
        totalGeneral += total;

        if (total > mayor) {
            mayor = total;
            mejor = jugador.nombre;
        }
    });

    if (lider) lider.textContent = mejor;
    if (puntos) puntos.textContent = totalGeneral;
    if (promedio) {
        promedio.textContent = jugadores.length
            ? Math.round(totalGeneral / jugadores.length)
            : 0;
    }
}

function normalizarNombre(nombre) {
    return nombre.trim().replace(/\s+/g, " ").toUpperCase();
}

function agregarJugador() {
    let nombre = prompt("🎁 Nombre del participante:");
    if (nombre === null) return;

    nombre = normalizarNombre(nombre);

    if (nombre.length < 2) {
        alert("El nombre debe tener al menos 2 caracteres.");
        return;
    }

    jugadores.push({ nombre, puntos: {} });
    guardar();
    renderTabla();

    alert("Participante agregado: " + nombre);
}

function renderEncabezado() {
    const encabezado = document.getElementById("encabezado");
    if (!encabezado) return;

    encabezado.innerHTML = "<th>🎁 PARTICIPANTE</th>";

    fechas.forEach(fecha => {
        const th = document.createElement("th");
        th.textContent = fecha;
        encabezado.appendChild(th);
    });

    const total = document.createElement("th");
    total.textContent = "🏆 TOTAL";
    encabezado.appendChild(total);

    const acciones = document.createElement("th");
    acciones.textContent = "⚙️ ACCIONES";
    encabezado.appendChild(acciones);
}

function renderTabla() {
    const tbody = document.getElementById("tbody");
    if (!tbody) return;

    let lista = [...jugadores];

    const buscador = document.getElementById("buscador");
    const texto = buscador ? buscador.value.toLowerCase().trim() : "";

    lista = lista.filter(j =>
        j.nombre.toLowerCase().includes(texto)
    );

    const orden = document.getElementById("orden");
    const tipo = orden ? orden.value : "puntaje";

    if (tipo === "puntaje") {
        lista.sort((a, b) => calcularTotal(b) - calcularTotal(a));
    } else if (tipo === "az") {
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (tipo === "za") {
        lista.sort((a, b) => b.nombre.localeCompare(a.nombre));
    }

    tbody.innerHTML = "";

    lista.forEach((jugador, index) => {
        if (!jugador.puntos) jugador.puntos = {};

        const fila = document.createElement("tr");
        const nombre = document.createElement("td");

        nombre.className = "nombre";

        const medallas = ["🥇 ", "🥈 ", "🥉 "];
        nombre.textContent = (medallas[index] || "") + jugador.nombre;
        fila.appendChild(nombre);

        let total;

        fechas.forEach(fecha => {
            const td = document.createElement("td");
            const input = document.createElement("input");

            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.value = jugador.puntos[fecha] ?? "";

            input.oninput = function() {
                if (this.value === "") {
                    delete jugador.puntos[fecha];
                } else {
                    let valor = Number(this.value);

                    if (!Number.isFinite(valor) || valor < 0) {
                        valor = 0;
                        this.value = 0;
                    }

                    jugador.puntos[fecha] = valor;
                }

                guardar();
                total.textContent = calcularTotal(jugador);
                actualizarEstadisticas();
                mostrarPodio();
            };

            td.appendChild(input);
            fila.appendChild(td);
        });

        total = document.createElement("td");
        total.className = "total";
        total.textContent = calcularTotal(jugador);
        fila.appendChild(total);

        const tdAcciones = document.createElement("td");

        const editar = document.createElement("button");
        editar.className = "btn azul";
        editar.textContent = "✏️";
        editar.title = "Editar participante";
        editar.onclick = () => editarJugador(jugador);

        const eliminar = document.createElement("button");
        eliminar.className = "btn rojo";
        eliminar.textContent = "🗑";
        eliminar.title = "Eliminar participante";

        eliminar.onclick = () => {
            if (confirm("¿Eliminar a " + jugador.nombre + "?")) {
                jugadores = jugadores.filter(x => x !== jugador);
                guardar();
                renderTabla();
            }
        };

        tdAcciones.append(editar, eliminar);
        fila.appendChild(tdAcciones);
        tbody.appendChild(fila);
    });

    mostrarPodio();
    actualizarEstadisticas();
}

function editarJugador(jugador) {
    const opcion = prompt(
        "¿Qué deseas editar?\n\n1 = Cambiar nombre\n2 = Cambiar puntaje"
    );

    if (opcion === "1") {
        let nuevo = prompt("Nuevo nombre:", jugador.nombre);
        if (nuevo === null) return;

        nuevo = normalizarNombre(nuevo);

        if (nuevo.length < 2) {
            alert("Nombre inválido.");
            return;
        }

        jugador.nombre = nuevo;
        guardar();
        renderTabla();
    }

    if (opcion === "2") {
        const fecha = prompt("Escribe la fecha:\n\n" + fechas.join("\n"));
        if (!fecha || !fechas.includes(fecha)) {
            alert("Fecha incorrecta.");
            return;
        }

        const valor = prompt("Nuevo puntaje para " + fecha);
        if (valor === null || valor.trim() === "") return;

        const puntos = Number(valor);

        if (!Number.isSafeInteger(puntos) || puntos < 0) {
            alert("Puntaje inválido.");
            return;
        }

        jugador.puntos[fecha] = puntos;
        guardar();
        renderTabla();
    }
}

function mostrarPodio() {
    const caja = document.getElementById("podio");
    if (!caja) return;

    caja.innerHTML = "";

    const ranking = [...jugadores].sort(
        (a, b) => calcularTotal(b) - calcularTotal(a)
    );

    ranking.slice(0, 3).forEach((jugador, i) => {
        const div = document.createElement("div");
        div.className = "medalla";

        if (i === 0) div.classList.add("oro");
        if (i === 1) div.classList.add("plata");
        if (i === 2) div.classList.add("bronce");

        const titulo = document.createElement("h3");
        titulo.textContent = ["👑🥇", "🥈", "🥉"][i] + " " + jugador.nombre;

        const detalle = document.createElement("p");
        detalle.textContent = "⭐ " + calcularTotal(jugador) + " puntos";

        div.append(titulo, detalle);
        caja.appendChild(div);
    });
}

function vaciarTodo() {
    if (!confirm("¿Seguro que deseas borrar todos los participantes del Pozito Regalón?")) return;

    jugadores = [];
    guardar();
    renderTabla();

    alert("Pozito Regalón ha sido limpiado correctamente.");
}

function modoOscuro() {
    document.body.classList.toggle("oscuro");
}

function guardarRespaldo() {
    const datos = JSON.stringify(jugadores, null, 2);
    const archivo = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "Pozito_Regalon_2026_Respaldo.json";
    enlace.click();

    URL.revokeObjectURL(url);
}

function restaurarRespaldo() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = function(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();

        lector.onload = function() {
            try {
                const datos = JSON.parse(lector.result);

                if (!Array.isArray(datos)) throw new Error();

                const validos = datos.every(j =>
                    j && typeof j.nombre === "string" &&
                    j.puntos && typeof j.puntos === "object" &&
                    !Array.isArray(j.puntos)
                );

                if (!validos) throw new Error();

                jugadores = datos;
                guardar();
                renderTabla();

                alert("Respaldo restaurado correctamente.");
            } catch {
                alert("Archivo incorrecto o dañado.");
            }
        };

        lector.readAsText(archivo);
    };

    input.click();
}

function mostrarResumen() {
    const resumen = [...jugadores]
        .map(jugador => ({
            ...jugador,
            total: calcularTotal(jugador)
        }))
        .sort((a, b) => b.total - a.total);

    localStorage.setItem(KEY_RESUMEN, JSON.stringify(resumen));
    window.location.href = "resultado.html";
}

function irRuleta() {
    const participantes = jugadores.filter(
        jugador => calcularTotal(jugador) >= 20
    );

    if (participantes.length === 0) {
        alert("No hay participantes con 20 puntos o más.");
        return;
    }

    localStorage.setItem(KEY_RULETA, JSON.stringify(participantes));
    window.location.href = "ruleta.html";
}

function activarJuly() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    const reconocimiento = new SpeechRecognition();

    reconocimiento.lang = "es-PE";
    reconocimiento.continuous = false;
    reconocimiento.interimResults = false;

    alert("🎤 JULY está escuchando...");

    reconocimiento.onresult = function(event) {
        const texto = event.results[0][0].transcript.toLowerCase();
        console.log("JULY escuchó:", texto);
        procesarJuly(texto);
    };

    reconocimiento.onerror = function() {
        alert("JULY no pudo escuchar correctamente.");
    };

    reconocimiento.start();
}

function procesarJuly(texto) {
    if (agregarPuntosJuly(texto)) return;

    if (texto.includes("agrega")) {
        const nombre = texto
            .replace(/\bjuly\b/g, "")
            .replace(/\bagrega\b/g, "")
            .replace(/\ba\b/g, "")
            .trim();

        if (nombre) {
            crearJugadorJuly(nombre);
            return;
        }
    }

    if (texto.includes("modo oscuro")) {
        modoOscuro();
        return;
    }

    if (texto.includes("vacia") || texto.includes("vacía")) {
        vaciarTodo();
        return;
    }

    if (texto.includes("resumen")) {
        mostrarResumen();
        return;
    }

    if (texto.includes("ruleta")) {
        irRuleta();
        return;
    }

    alert("JULY no entendió la orden.");
}

function crearJugadorJuly(nombre) {
    nombre = normalizarNombre(nombre);

    if (nombre.length < 2) {
        alert("Nombre inválido.");
        return;
    }

    jugadores.push({ nombre, puntos: {} });
    guardar();
    renderTabla();

    alert("JULY agregó a " + nombre);
}

function agregarPuntosJuly(texto) {
    const meses = {
        enero: 1,
        febrero: 2,
        marzo: 3,
        abril: 4,
        mayo: 5,
        junio: 6,
        julio: 7,
        agosto: 8,
        septiembre: 9,
        setiembre: 9,
        octubre: 10,
        noviembre: 11,
        diciembre: 12
    };

    const fechaVoz = texto.match(
        /(\d{1,2}) de ([a-záéíóúñ]+)/
    );

    if (!fechaVoz) return false;

    const numeros = texto.match(/\d+/g);
    if (!numeros) return false;

    const dia = Number(fechaVoz[1]);
    const mes = meses[fechaVoz[2]];

    if (!mes || dia < 1 || dia > 31) return false;

    const fecha = new Date(2026, mes - 1, dia);

    if (
        fecha.getDate() !== dia ||
        fecha.getMonth() !== mes - 1
    ) return false;

    const fechaTexto = fecha.toLocaleDateString("es-ES");

    if (!fechas.includes(fechaTexto)) {
        alert(
            "Fecha fuera del Pozito Regalón 2026.\n" +
            "El concurso es del 03 de noviembre al 02 de diciembre."
        );
        return true;
    }

    const puntos = Number(numeros[numeros.length - 1]);

    if (!Number.isSafeInteger(puntos) || puntos < 0) {
        alert("Puntaje inválido.");
        return true;
    }

    const jugador = jugadores.find(j =>
        texto.includes(j.nombre.toLowerCase())
    );

    if (!jugador) {
        alert("JULY no encontró al participante. Agrégalo primero.");
        return true;
    }

    jugador.puntos[fechaTexto] = puntos;

    guardar();
    renderTabla();

    alert(
        "JULY agregó " + puntos + " puntos a " +
        jugador.nombre + " el " + fechaTexto
    );

    return true;
}

/* =========================================
   INICIO DEL SISTEMA
========================================= */

generarFechas();
actualizarReloj();
renderEncabezado();
renderTabla();

