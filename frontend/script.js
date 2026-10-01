const API_URL = "http://127.0.0.1:8000";

const saldoTexto = document.getElementById("saldo");
const previsaoTexto = document.getElementById("previsao");
const listaTransacoes = document.getElementById("lista-transacoes");

let totalEntradas = 0;
let totalSaidas = 0;

const ctx = document.getElementById("grafico-rosca");
const grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Entradas", "Saídas"],
        datasets: [{
            data: [0, 0],
            backgroundColor: ["#4ade80", "#f87171"],
            borderWidth: 0
        }]
    },
    options: {
        plugins: {
            legend: { labels: { color: "#ffffff" } }
        }
    }
});

function formatarMoeda(valor) {
    return "R$ " + (valor / 100).toFixed(2).replace(".", ",");
}

function atualizarGrafico() {
    grafico.data.datasets[0].data = [totalEntradas, totalSaidas];
    grafico.update();
}

function renderizarTransacao(transacao) {
    const item = document.createElement("li");
    const sinal = transacao.tipo === "entrada" ? "+" : "-";
    item.textContent = transacao.descricao + ": " + sinal + " " + formatarMoeda(transacao.valor_centavos);
    item.classList.add(transacao.tipo);
    listaTransacoes.appendChild(item);
}

async function carregarTransacoes() {
    const resposta = await fetch(API_URL + "/transacoes");
    const transacoes = await resposta.json();

    listaTransacoes.innerHTML = "";
    totalEntradas = 0;
    totalSaidas = 0;

    transacoes.forEach(function(transacao) {
        renderizarTransacao(transacao);
        if (transacao.tipo === "entrada") {
            totalEntradas += transacao.valor_centavos;
        } else {
            totalSaidas += transacao.valor_centavos;
        }
    });

    const saldo = totalEntradas - totalSaidas;
    saldoTexto.textContent = formatarMoeda(saldo);
    previsaoTexto.textContent = formatarMoeda(saldo);
    atualizarGrafico();
}

async function criarTransacao(descricao, valorCentavos, tipo) {
    await fetch(API_URL + "/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            descricao: descricao,
            valor_centavos: valorCentavos,
            tipo: tipo,
            data: new Date().toISOString().split("T")[0],
            categoria_id: null
        })
    });

    await carregarTransacoes();
}

document.getElementById("btn-entrada").addEventListener("click", async function() {
    const input = document.getElementById("valor-entrada");
    const valor = Number(input.value);

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    const valorCentavos = Math.round(valor * 100);
    await criarTransacao("Entrada", valorCentavos, "entrada");
    input.value = "";
});

document.getElementById("btn-saida").addEventListener("click", async function() {
    const input = document.getElementById("valor-saida");
    const valor = Number(input.value);

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    const valorCentavos = Math.round(valor * 100);
    await criarTransacao("Saída", valorCentavos, "saida");
    input.value = "";
});

carregarTransacoes();