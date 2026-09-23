let saldo = 1000;

const saldoTexto = document.getElementById("saldo");
const previsaoTexto = document.getElementById("previsao");
const listaTransacoes = document.getElementById("lista-transacoes");

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
    adicionarTransacao("Saída", valor, "saida");
    atualizarTela();
    input.value = "";
});