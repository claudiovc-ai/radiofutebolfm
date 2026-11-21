
const lista = document.getElementById("lista-noticias");
const statusNoticias = document.getElementById("status-noticias");
const botaoAtualizar = document.getElementById("atualizar-noticias");

const imagemPadrao =
"https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80";

// Feed de notícias de futebol em português.
const feed =
"https://news.google.com/rss/search?q=futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419";

const endereco =
"https://api.rss2json.com/v1/api.json?rss_url=" +
encodeURIComponent(feed);

function escapar(texto) {
  return String(texto || "").replace(/[&<>"']/g, letra => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[letra]));
}

function dataFormatada(data) {
  const d = new Date(data);

  if (isNaN(d.getTime())) return "Notícia recente";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function pegarImagem(item) {
  if (item.thumbnail) return item.thumbnail;

  if (item.enclosure && item.enclosure.link) {
    return item.enclosure.link;
  }

  const descricao = item.description || "";
  const resultado = descricao.match(/<img[^>]+src=["']([^"']+)/i);

  return resultado ? resultado[1] : imagemPadrao;
}

function mostrarNoticias(items) {
  const noticias = items
    .filter(item => item.title && item.link)
    .slice(0, 12);

  if (!noticias.length) {
    throw new Error("Nenhuma notícia encontrada.");
  }

  lista.innerHTML = noticias.map(item => {
    const titulo = escapar(item.title);
    const link = escapar(item.link);
    const imagem = escapar(pegarImagem(item));
    const fonte = escapar(
      item.author || item.source || "Fonte original"
    );

    return `
      <article class="noticia">
        <a href="${link}" target="_blank" rel="noopener noreferrer">
          <img
            src="${imagem}"
            alt=""
            loading="lazy"
            onerror="this.onerror=null;this.src='${imagemPadrao}'">
        </a>

        <div class="noticia-corpo">
          <div class="noticia-data">
            ${dataFormatada(item.pubDate)}
          </div>

          <h3>
            <a href="${link}" target="_blank" rel="noopener noreferrer">
              ${titulo}
            </a>
          </h3>

          <div class="noticia-fonte">${fonte}</div>
        </div>
      </article>
    `;
  }).join("");

  statusNoticias.textContent =
    "Última atualização: " +
    new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
}

let carregando = false;

async function atualizarNoticias() {
  if (carregando) return;

  carregando = true;
  statusNoticias.textContent = "Buscando notícias recentes...";

  if (botaoAtualizar) {
    botaoAtualizar.disabled = true;
  }

  try {
    const resposta = await fetch(endereco, {
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error("Erro ao consultar as notícias.");
    }

    const dados = await resposta.json();

    if (dados.status !== "ok" || !dados.items) {
      throw new Error("Feed temporariamente indisponível.");
    }

    mostrarNoticias(dados.items);

  } catch (erro) {
    statusNoticias.innerHTML =
      'Não foi possível atualizar agora. ' +
      '<a href="https://news.google.com/search?q=futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419" target="_blank" rel="noopener">Veja as notícias aqui.</a>';

    if (!lista.querySelector(".noticia")) {
      lista.innerHTML =
        "<p>As notícias estão temporariamente indisponíveis. Tente novamente mais tarde.</p>";
    }

  } finally {
    carregando = false;

    if (botaoAtualizar) {
      botaoAtualizar.disabled = false;
    }
  }
}

if (botaoAtualizar) {
  botaoAtualizar.addEventListener("click", atualizarNoticias);
}

atualizarNoticias();

// Tenta atualizar automaticamente a cada 15 minutos.
setInterval(atualizarNoticias, 15 * 60 * 1000);
