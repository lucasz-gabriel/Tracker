
const API_URL = "http://127.0.0.1:8000";

let graficoEvolucao = null;
let graficoGastos = null;

// Formata valores armazenados em centavos.
function formatarMoeda(centavos) {
    return (centavos / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function converterData(data) {
    if (data instanceof Date) {
        return new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

function dataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function nomeMes(data) {
    return `${String(data.getDate()).padStart(2, "0")}/${String(
        data.getMonth() + 1
    ).padStart(2, "0")}`;
}

function obterUltimoDiaDoMes(ano, mes) {
    return new Date(ano, mes, 0).getDate();
}

async function buscarDados() {
    const [resTransacoes, resCategorias, resAssinaturas, resCobrancas] =
        await Promise.all([
            fetch(`${API_URL}/transacoes`),
            fetch(`${API_URL}/categorias`),
            fetch(`${API_URL}/assinaturas`),
            fetch(`${API_URL}/cobrancas`)
        ]);

    const respostas = [
        resTransacoes,
        resCategorias,
        resAssinaturas,
        resCobrancas
    ];

    if (respostas.some(resposta => !resposta.ok)) {
        throw new Error("Não foi possível carregar os dados da API.");
    }

    const [transacoes, categorias, assinaturas, cobrancas] =
        await Promise.all(respostas.map(resposta => resposta.json()));

    return { transacoes, categorias, assinaturas, cobrancas };
}

function calcularSaldoAtual(transacoes) {
    return transacoes.reduce((saldo, transacao) => {
        if (transacao.tipo === "entrada") {
            return saldo + transacao.valor_centavos;
        }

        return saldo - transacao.valor_centavos;
    }, 0);
}
function preverAssinaturas(
    assinaturas,
    cobrancas,
    transacoes,
    hoje,
    fimPeriodo
) {
    const eventos = [];

    const transacoesPorId = new Map(
        transacoes.map(transacao => [transacao.id, transacao])
    );

    for (const assinatura of assinaturas) {
        if (!assinatura.ativa) continue;

        const primeiroMes = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            1
        );

        const ultimoMes = new Date(
            fimPeriodo.getFullYear(),
            fimPeriodo.getMonth(),
            1
        );

        for (
            let mesAtual = new Date(primeiroMes);
            mesAtual <= ultimoMes;
            mesAtual.setMonth(mesAtual.getMonth() + 1)
        ) {
            const ano = mesAtual.getFullYear();
            const mes = mesAtual.getMonth() + 1;

            const dia = Math.min(
                assinatura.dia_vencimento,
                obterUltimoDiaDoMes(ano, mes)
            );

            const vencimento = new Date(ano, mes - 1, dia);

            if (vencimento <= hoje || vencimento > fimPeriodo) {
                continue;
            }

            const cobranca = cobrancas.find(item =>
                item.assinatura_id === assinatura.id &&
                item.ano === ano &&
                item.mes === mes
            );

            if (cobranca && cobranca.status !== "pendente") {
                continue;
            }

            // Evita descontar novamente uma cobrança já vinculada
            // a uma transação existente.
            if (
                cobranca?.transacao_id &&
                transacoesPorId.has(cobranca.transacao_id)
            ) {
                continue;
            }

            eventos.push({
                data: vencimento,
                valor_centavos: cobranca
                    ? cobranca.valor_centavos
                    : assinatura.valor_centavos,
                tipo: "saida",
                categoria_id: assinatura.categoria_id,
                descricao: `Assinatura: ${assinatura.nome}`
            });
        }
    }

    return eventos;
}

function atualizarCards(
    saldoAtual,
    entradasPrevistas,
    saidasPrevistas
) {
    document.getElementById("preventrada").textContent =
        formatarMoeda(entradasPrevistas);

    document.getElementById("prevsaida").textContent =
        formatarMoeda(saidasPrevistas);

    document.getElementById("prevsaldo").textContent =
        formatarMoeda(
            saldoAtual + entradasPrevistas - saidasPrevistas
        );
}

function criarGraficoEvolucao(saldoAtual, eventos, hoje, fimPeriodo) {
    const canvas = document.getElementById("grafico-evolucao");

    const eventosPorData = new Map();

    for (const evento of eventos) {
        const chave = dataISO(evento.data);

        if (!eventosPorData.has(chave)) {
            eventosPorData.set(chave, 0);
        }

        const valor = evento.tipo === "entrada"
            ? evento.valor_centavos
            : -evento.valor_centavos;

        eventosPorData.set(
            chave,
            eventosPorData.get(chave) + valor
        );
    }

    const labels = [];
    const valores = [];
    let saldoProjetado = saldoAtual;

    for (
        let dia = new Date(hoje);
        dia <= fimPeriodo;
        dia.setDate(dia.getDate() + 1)
    ) {
        const chave = dataISO(dia);

        if (eventosPorData.has(chave)) {
            saldoProjetado += eventosPorData.get(chave);
        }

        labels.push(nomeMes(dia));
        valores.push(saldoProjetado / 100);
    }

    if (graficoEvolucao) graficoEvolucao.destroy();

    graficoEvolucao = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Saldo projetado",
                data: valores,
                borderColor: "#a855f7",
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            `Saldo: ${formatarMoeda(
                                Math.round(contexto.parsed.y * 100)
                            )}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: valor =>
                            formatarMoeda(Math.round(valor * 100))
                    }
                }
            }
        }
    });
}

function criarGraficoGastos(eventos, categorias) {

    const mensagem = document.getElementById("mensagem-historico");
    const containerGrafico = document.getElementById("container-grafico-gastos");

    mensagem.hidden = true;
    containerGrafico.hidden = false;
    
    const canvas = document.getElementById("grafico-gastos");
    const gastosPorCategoria = new Map();

    for (const evento of eventos) {
        if (evento.tipo !== "saida") continue;

        const categoria = categorias.find(
            item => item.id === evento.categoria_id
        );

        const nome = categoria
            ? categoria.nome
            : "Sem categoria";

        gastosPorCategoria.set(
            nome,
            (gastosPorCategoria.get(nome) || 0) +
                evento.valor_centavos
        );
    }

    let labels = [...gastosPorCategoria.keys()];
    let valores = [...gastosPorCategoria.values()];

    if (labels.length === 0) {
        labels = ["Nenhum gasto previsto"];
        valores = [0];
    }

    if (graficoGastos) graficoGastos.destroy();

    graficoGastos = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Gastos previstos",
                data: valores.map(valor => valor / 100),
                backgroundColor: [
                    "#a855f7",
                    "#9333ea",
                    "#7e22ce",
                    "#c084fc",
                    "#6b21a8",
                    "#d8b4fe"
                ],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            datasets: {
        bar: {
            barThickness: 55,
            maxBarThickness: 55
        }
    },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: contexto =>
                            ` ${formatarMoeda(
                                Math.round(contexto.parsed.x * 100)
                            )}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grace:"10%",
                    ticks: {
                        callback: valor =>
                            formatarMoeda(Math.round(valor * 100))
                    }
                },
                y:{
                    beginAtZero:true
                }
            }
        }
    });
}

async function carregarPrevisao() {
    try {
        const { transacoes, categorias, assinaturas, cobrancas } =
            await buscarDados();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const fimPeriodo = new Date(hoje);
        fimPeriodo.setDate(fimPeriodo.getDate() + 30);

        // O saldo atual já inclui as transações de hoje.
        // Por isso, só adicionamos transações de datas futuras.
        const transacoesFuturas = transacoes
            .filter(transacao => {
                const data = converterData(transacao.data);
                return data > hoje && data <= fimPeriodo;
            })
            .map(transacao => ({
                ...transacao,
                data: converterData(transacao.data)
            }));

        const assinaturasFuturas = preverAssinaturas(
            assinaturas,
            cobrancas,
            transacoes,
            hoje,
            fimPeriodo
        );

        const eventos = [
            ...transacoesFuturas,
            ...assinaturasFuturas
        ];

        const entradasPrevistas = eventos.reduce(
            (total, evento) =>
                evento.tipo === "entrada"
                    ? total + evento.valor_centavos
                    : total,
            0
        );

        const saidasPrevistas = eventos.reduce(
            (total, evento) =>
                evento.tipo === "saida"
                    ? total + evento.valor_centavos
                    : total,
            0
        );

        const saldoAtual = calcularSaldoAtual(transacoes);

        atualizarCards(
            saldoAtual,
            entradasPrevistas,
            saidasPrevistas
        );

        criarGraficoEvolucao(
            saldoAtual,
            eventos,
            hoje,
            fimPeriodo
        );

        criarGraficoGastos(eventos, categorias);

    } catch (erro) {
        console.error("Erro ao carregar previsão financeira:", erro);
    }
}

carregarPrevisao();
