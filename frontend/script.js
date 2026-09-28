let saldo = 1000;
let totalEntradas = 0;
let totalSaidas = 0;

const saldoTexto = document.getElementById("saldo");
const previsaoTexto = document.getElementById("previsao");
const listaTransacoes = document.getElementById("lista-transacoes");

const ctx = document.getElementById("grafico-rosca");
const grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Entradas", "Saídas"],
        datasets: [{
            data: [totalEntradas, totalSaidas],
            backgroundColor: ["#4ade80", "#f87171"],
            borderWidth: 0
        }]
    },
    options: {
        plugins: {
            legend: {
                labels: { color: "#ffffff" }
            }
        }
    }
});

function atualizarGrafico() {
    grafico.data.datasets[0].data = [totalEntradas, totalSaidas];
    grafico.update();
}

function formatarMoeda(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
}

function atualizarTela() {
    saldoTexto.textContent = formatarMoeda(saldo);
    previsaoTexto.textContent = formatarMoeda(saldo);
}

function adicionarTransacao(descricao, valor, tipo) {
    const item = document.createElement("li");
    const sinal = tipo === "entrada" ? "+" : "-";
    item.textContent = descricao + ": " + sinal + " " + formatarMoeda(Math.abs(valor));
    item.classList.add(tipo); 
    listaTransacoes.prepend(item);
}

document.getElementById("btn-entrada").addEventListener("click", function() {
    const input = document.getElementById("valor-entrada");
    const valor = Number(input.value);

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    saldo += valor;
    totalEntradas += valor;
    atualizarGrafico()
    adicionarTransacao("Entrada", valor, "entrada");
    atualizarTela();
    input.value = "";
});

document.getElementById("btn-saida").addEventListener("click", function() {
    const input = document.getElementById("valor-saida");
    const valor = Number(input.value);

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    saldo -= valor;
    totalSaidas += valor;
    atualizarGrafico()
    adicionarTransacao("Saída", valor, "saida");
    atualizarTela();
    input.value = "";
});

