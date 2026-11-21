
/* ==========================================
   RADIO FUTEBOL FM
   NOTICIAS ATUALIZADAS A CADA 2 MINUTOS
========================================== */

(function () {
  "use strict";

  if (window.RFNoticiasIniciado) return;
  window.RFNoticiasIniciado = true;

  const INTERVALO = 2 * 60 * 1000;
  const LIMITE = 20;
  const PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

  const FONTES = [
    {
      nome: "G1 Esportes",
      url: "https://g1.globo.com/dynamo/esportes/rss2.xml"
    },
    {
      nome: "Itatiaia",
      url: "https://news.google.com/rss/search?q=site%3Aitatiaia.com.br%2Fesportes+futebol&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
    },
    {
      nome: "Futebol brasileiro",
      url: "https://news.google.com/rss/search?q=futebol+brasileiro&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
    },
    {
      nome: "Atlético-MG",
      url: "https://news.google.com/rss/search?q=Atl%C3%A9tico+Mineiro&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
    },
    {
      nome: "Cruzeiro",
      url: "https://news.google.com/rss/search?q=Cruzeiro+futebol&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
    },
    {
      nome: "Futebol internacional",
      url: "https://news.google.com/rss/search?q=futebol+internacional&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
    }
  ];

  let noticias = [];
  let carregando = false;

  const lista = document.getElementById("lista-noticias");
  const slider = document.getElementById("rf-news-slider");
  const status = document.getElementById("status-noticias");
  const botao =
    document.getElementById("atualizar-noticias") ||
    document.getElementById("rf-news-refresh");

  function limparTexto(texto) {
    const elemento = document.createElement("div");
    elemento.innerHTML = texto || "";
    return (elemento.textContent || "").trim();
  }

  function urlValida(valor) {
    try {
      const url = new URL(valor);
      return ["https:", "http:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function dataHoje(data) {
    const d = new Date(data);
    if (isNaN(d.getTime())) return false;

    const hoje = new Date();

    return (
      d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  }

  function formatarData(data) {
    const d = new Date(data);

    if (isNaN(d.getTime())) {
      return "Data não informada";
    }

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function pegarImagem(item) {
    let imagem =
      item.thumbnail ||
      (item.enclosure && item.enclosure.link) ||
      "";

    if (!imagem && item.description) {
      const div = document.createElement("div");
      div.innerHTML = item.description;

      const img = div.querySelector("img");

      if (img) {
        imagem = img.getAttribute("src") || "";
      }
    }

    return urlValida(imagem);
  }

  async function buscarFonte(fonte) {
    const controlador = new AbortController();

    const tempo = setTimeout(
      () => controlador.abort(),
      15000
    );

    try {
      const endereco =
        PROXY + encodeURIComponent(fonte.url);

      const resposta = await fetch(endereco, {
        cache: "no-store",
        signal: controlador.signal
      });

      if (!resposta.ok) {
        throw new Error("Falha na fonte");
      }

      const dados = await resposta.json();

      if (
        dados.status !== "ok" ||
        !Array.isArray(dados.items)
      ) {
        throw new Error("Feed indisponível");
      }

      return dados.items.map(item => {
        const link = urlValida(item.link);
        const titulo = limparTexto(item.title);

        if (!link || !titulo) return null;

        return {
          titulo: titulo,
          link: link,
          resumo: limparTexto(item.description).slice(0, 250),
          imagem: pegarImagem(item),
          fonte: fonte.nome,
          publicacao: item.pubDate || "",
          data: formatarData(item.pubDate)
        };
      }).filter(Boolean);

    } finally {
      clearTimeout(tempo);
    }
  }

  function criarCard(noticia) {
    const card = document.createElement("article");
    card.className = "noticia";

    if (noticia.imagem) {
      const imagem = document.createElement("img");

      imagem.src = noticia.imagem;
      imagem.alt = "Imagem da notícia";
      imagem.loading = "lazy";

      imagem.onerror = function () {
        this.remove();
      };

      card.appendChild(imagem);
    }

    const corpo = document.createElement("div");
    corpo.className = "noticia-corpo";

    const data = document.createElement("div");
    data.className = "noticia-data";
    data.textContent = noticia.data;

    const titulo = document.createElement("h3");
    titulo.textContent = noticia.titulo;

    const resumo = document.createElement("p");
    resumo.textContent = noticia.resumo;

    const fonte = document.createElement("div");
    fonte.className = "noticia-fonte";
    fonte.textContent = noticia.fonte;

    const link = document.createElement("a");
    link.href = noticia.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "LER NOTÍCIA COMPLETA →";

    corpo.append(data, titulo);

    if (noticia.resumo) {
      corpo.appendChild(resumo);
    }

    corpo.append(fonte, link);
    card.appendChild(corpo);

    return card;
  }

  function mostrarNoticias() {
    if (lista) {
      lista.replaceChildren();

      noticias.forEach(noticia => {
        lista.appendChild(criarCard(noticia));
      });
    }

    if (slider) {
      slider.replaceChildren();

      noticias.slice(0, 12).forEach(noticia => {
        slider.appendChild(criarCard(noticia));
      });
    }
  }

  function atualizarStatus(mensagem) {
    if (status) {
      status.textContent = mensagem;
    }
  }

  async function atualizarNoticias() {
    if (carregando || (!lista && !slider)) return;

    carregando = true;

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Buscando notícias...";
    }

    atualizarStatus("Buscando notícias publicadas hoje...");

    try {
      const resultados = await Promise.allSettled(
        FONTES.map(buscarFonte)
      );

      let todas = [];

      resultados.forEach(resultado => {
        if (resultado.status === "fulfilled") {
          todas = todas.concat(resultado.value);
        }
      });

      const unicas = new Map();

      todas.forEach(noticia => {
        if (!unicas.has(noticia.link)) {
          unicas.set(noticia.link, noticia);
        }
      });

      todas = Array.from(unicas.values());

      todas.sort((a, b) => {
        return (
          new Date(b.publicacao).getTime() -
          new Date(a.publicacao).getTime()
        );
      });

      const publicadasHoje = todas.filter(noticia =>
        dataHoje(noticia.publicacao)
      );

      const selecionadas = publicadasHoje.length
        ? publicadasHoje
        : todas;

      if (!selecionadas.length) {
        atualizarStatus(
          "Não foi possível obter notícias agora. Tente novamente."
        );
        return;
      }

      noticias = selecionadas.slice(0, LIMITE);

      mostrarNoticias();

      const horario = new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

      atualizarStatus(
        publicadasHoje.length
          ? "Notícias de hoje • Atualizado às " + horario +
            " • " + noticias.length + " notícias."
          : "Não encontramos publicações de hoje nas fontes consultadas. Exibindo as notícias mais recentes disponíveis. Atualizado às " + horario + "."
      );

    } catch (erro) {
      console.error("Erro nas notícias:", erro);

      atualizarStatus(
        "Falha temporária ao buscar notícias. Tente novamente."
      );

    } finally {
      carregando = false;

      if (botao) {
        botao.disabled = false;
        botao.textContent = "↻ Atualizar";
      }
    }
  }

  if (botao) {
    botao.addEventListener(
      "click",
      atualizarNoticias
    );
  }

  atualizarNoticias();

  setInterval(() => {
    if (document.visibilityState === "visible") {
      atualizarNoticias();
    }
  }, INTERVALO);

})();
