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
            backgroundColor: ["#22c55e", "#dc2626"],
            borderWidth: 0
        }]
    },
    options: {
        responsive: false,
        plugins: {
            legend: {
                labels: {
                    color: "#ffffff"
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.label + ": " +
                            context.parsed.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                            });
                    }
                }
            }
        }
    }
});

function formatarMoeda(valor) {
    return "R$ " + (valor / 100).toFixed(2).replace(".", ",");
}

function atualizarGrafico() {
    grafico.data.datasets[0].data = [totalEntradas/100, totalSaidas/100];
    grafico.update();
}

function renderizarTransacao(transacao) {
    const item = document.createElement("li");
    const sinal = transacao.tipo === "entrada" ? "+" : "-";

    const texto = document.createElement("span");
    texto.textContent = transacao.descricao + ": " + sinal + " " + formatarMoeda(transacao.valor_centavos);

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "x";
    btnExcluir.classList.add("btn-excluir");
    btnExcluir.addEventListener("click", async function() {
        await fetch(API_URL + "/transacoes/" + transacao.id,  {
            method: "DELETE"
        })
        await carregarTransacoes();
    });
    item.appendChild(texto);
    item.appendChild(btnExcluir);
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

    document.getElementById("total-entradas").textContent = formatarMoeda(totalEntradas);
    document.getElementById("total-saidas").textContent = formatarMoeda(totalSaidas);
}

async function criarTransacao(descricao, valorCentavos, tipo, categoriaID) {
    await fetch(API_URL + "/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            descricao: descricao,
            valor_centavos: valorCentavos,
            tipo: tipo,
            data: new Date().toISOString().split("T")[0],
            categoria_id: categoriaID || null
        })
    });

    await carregarTransacoes();
}

async function carregarCategorias() {
    const resposta = await fetch(API_URL + "/categorias");
    const categorias = await resposta.json();

    const selectEntrada = document.getElementById("categoria-entrada");
    const selectSaida = document.getElementById("categoria-saida");

    selectEntrada.innerHTML='<option value="">Sem categoria </option>';
    selectSaida.innerHTML='<option value="">Sem categoria </option>';

     categorias.forEach(function(categoria) {
        const opcao = document.createElement("option");

        opcao.value = categoria.id;
        opcao.textContent = categoria.nome;

        if (categoria.tipo === "entrada") {
            selectEntrada.appendChild(opcao);
        } else if (categoria.tipo === "saida") {
            selectSaida.appendChild(opcao);
        }
    });
}


// Event listeners dos botões de entrada e saída
document.getElementById("btn-entrada").addEventListener("click", async function() {
    const inputDescricao = document.getElementById("descricao-entrada");
    const input = document.getElementById("valor-entrada");
    const categoriaID = document.getElementById("categoria-entrada").value;

    const valor = Number(input.value); 
    const descricao = inputDescricao.value.trim() || "Entrada";

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    const valorCentavos = Math.round(valor * 100);
    await criarTransacao(descricao, valorCentavos, "entrada", categoriaID);
    input.value = "";
    inputDescricao.value = "";
});

document.getElementById("btn-saida").addEventListener("click", async function() {
    const inputDescricao = document.getElementById("descricao-saida");
    const input = document.getElementById("valor-saida");
    const categoriaID = document.getElementById("categoria-saida").value;

    const valor = Number(input.value);
    const descricao = inputDescricao.value.trim() || "Saída";

    if (!valor || valor <= 0) {
        alert("Digite um valor válido");
        return;
    }

    const valorCentavos = Math.round(valor * 100);
    await criarTransacao(descricao, valorCentavos, "saida", categoriaID);
    input.value = "";
    inputDescricao.value = "";
});

document.getElementById("btn-assinatura").addEventListener("click", async function() {
    const inputNome = document.getElementById("nome-assinatura");
    const inputValor = document.getElementById("valor-assinatura");
    const inputDia = document.getElementById("dia-assinatura");

    const nome = inputNome.value.trim();
    const valor = Number(inputValor.value);
    const dia = Number(inputDia.value);

    if(!nome || !valor || valor <= 0 || !dia || dia < 1 || dia > 31){
        alert("Preencha todos os campos corretamente");
        return;
    }
    
    await fetch(API_URL + "/assinaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            nome: nome,
            valor_centavos: Math.round(valor * 100),
            dia_vencimento: dia,
            ativa: true,
            categoria_id: null
        })
    });

    inputNome.value = "";
    inputValor.value = "";
    inputDia.value = "";

    await carregarAssinaturas();
        });


async function carregarAssinaturas() {
    const resposta = await fetch(API_URL + "/assinaturas");
    const assinaturas = await resposta.json();

    const lista = document.getElementById("lista-assinaturas");
    lista.innerHTML = "";

    const assinaturasAtivas = assinaturas.filter(function(assinatura) {
        return assinatura.ativa === true;
    });

    assinaturasAtivas.forEach(function(assinatura) {
        const item = document.createElement("li");

        item.innerHTML =
            "<span>" + assinatura.nome + "</span>" +
            "<span>dia " + assinatura.dia_vencimento +
            " · " + formatarMoeda(assinatura.valor_centavos) + "</span>";

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "x";
        btnExcluir.classList.add("btn-excluir");

        btnExcluir.addEventListener("click", async function() {
            try {
                const resposta = await fetch(
                    API_URL + "/assinaturas/" + assinatura.id,
                    { method: "DELETE" }
                );

                if (!resposta.ok) {
                    throw new Error("Não foi possível excluir a assinatura.");
                }

                await carregarAssinaturas();
            } catch (erro) {
                alert(erro.message);
            }
        });

        item.appendChild(btnExcluir);
        lista.appendChild(item);
    });
}


carregarTransacoes();
carregarCategorias();
carregarAssinaturas();