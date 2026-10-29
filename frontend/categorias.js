const API_URL = "http://127.0.0.1:8000";

async function carregarCategorias() {
    const listaEntradas = document.getElementById("lista-entradas");
    const listaSaidas = document.getElementById("lista-saidas");

    try {
        const resposta = await fetch(`${API_URL}/categorias`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar categorias.");
        }

        const categorias = await resposta.json();

        listaEntradas.replaceChildren();
        listaSaidas.replaceChildren();

        const tituloEntradas = document.createElement("h3");
        tituloEntradas.textContent = "Categorias de entrada";

        const tituloSaidas = document.createElement("h3");
        tituloSaidas.textContent = "Categorias de saída";

        listaEntradas.appendChild(tituloEntradas);
        listaSaidas.appendChild(tituloSaidas);

        categorias.forEach(categoria => {
            const item = document.createElement("div");
            item.classList.add("categoria-item");

            const nome = document.createElement("span");
            nome.textContent = categoria.nome;

            const botaoExcluir = document.createElement("button");
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.classList.add("btn-excluir-categoria");

            botaoExcluir.addEventListener("click", () => {
                deletarCategoria(categoria.id, categoria.nome);
            });

            item.append(nome, botaoExcluir);

            if (categoria.tipo === "entrada") {
                listaEntradas.appendChild(item);
            } else if (categoria.tipo === "saida") {
                listaSaidas.appendChild(item);
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
    }

    async function deletarCategoria(id, nome) {
    const confirmado = confirm(
        `Deseja excluir a categoria "${nome}"?`
    );

    if (!confirmado) return;

    try {
        const resposta = await fetch(`${API_URL}/categorias/${id}`, {
            method: "DELETE"
        });

        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(
                erro.detail || "Não foi possível excluir a categoria."
            );
        }

        await carregarCategorias();
        alert("Categoria excluída com sucesso!");

    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro);
        alert(erro.message || "Não foi possível conectar ao servidor.");
    }
}   
}

async function criarCategoria(tipo, inputId) {
    const input = document.getElementById(inputId);
    const nome = input.value.trim();

    if (!nome) {
        alert("Digite o nome da categoria.");
        input.focus();
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/categorias`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                tipo: tipo
            })
        });

        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.detail || "Não foi possível criar a categoria.");
        }

        input.value = "";
        await carregarCategorias();

        alert("Categoria criada com sucesso!");

    } catch (erro) {
        console.error("Erro ao criar categoria:", erro);
        alert(erro.message || "Não foi possível conectar ao servidor.");
    }
}

document.getElementById("btn-catentrada").addEventListener("click", () => {
    criarCategoria("entrada", "desc-catentrada");
});

document.getElementById("btn-catsaida").addEventListener("click", () => {
    criarCategoria("saida", "desc-catsaida");
});

document.addEventListener("DOMContentLoaded", carregarCategorias);  