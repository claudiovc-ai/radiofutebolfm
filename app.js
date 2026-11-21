
/* ==========================================================
   RÁDIO FUTEBOL FM — SLIDER AUTOMÁTICO DE NOTÍCIAS
   Visual responsivo, proteção contra falhas e atualização.
   ========================================================== */
(function () {
  "use strict";

  if (window.RFNoticiasIniciado) return;
  window.RFNoticiasIniciado = true;

  var CONFIG = {
    intervaloSlide: 7000,
    intervaloAtualizacao: 5 * 60 * 1000,
    limiteNoticias: 12,
    tempoLimite: 10000,

    // Fontes RSS públicas de notícias esportivas.
    fontes: [
      {
        nome: "Futebol",
        url: "https://g1.globo.com/dynamo/esportes/rss2.xml"
      },
      {
        nome: "Flamengo",
        url: "https://news.google.com/rss/search?q=Flamengo+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419"
      },
      {
        nome: "Atlético-MG",
        url: "https://news.google.com/rss/search?q=Atl%C3%A9tico+Mineiro+Galo&hl=pt-BR&gl=BR&ceid=BR:pt-419"
      },
      {
        nome: "Cruzeiro",
        url: "https://news.google.com/rss/search?q=Cruzeiro+esporte+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419"
      }
    ],

    // Serviço público para converter RSS em JSON.
    // Se o serviço estiver indisponível, a rotina tenta
    // outra fonte e preserva as notícias já carregadas.
    proxy: "https://api.rss2json.com/v1/api.json?rss_url="
  };

  var slider;
  var indiceAtual = 0;
  var noticias = [];
  var timerSlide = null;
  var timerAtualizacao = null;
  var carregando = false;
  var ultimaAtualizacao = 0;

  function criarElemento(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  function aplicarEstiloNoticias() {
    if (document.getElementById("rf-news-custom-style")) return;

    var estilo = document.createElement("style");
    estilo.id = "rf-news-custom-style";

    estilo.textContent = `
      #rf-news-slider {
        position: relative;
        box-sizing: border-box;
        width: 100%;
        overflow: hidden;
        padding: 10px;
        border-radius: 12px;
        background: #eef2f6;
        color: #171717;
      }

      #rf-news-slider .rf-slide-item {
        display: none;
        box-sizing: border-box;
        width: 100%;
        min-height: 230px;
        align-items: stretch;
        gap: 16px;
        padding: 12px;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,.08);
      }

      #rf-news-slider .rf-slide-item.ativo {
        display: flex;
        animation: rfNewsFadeIn .3s ease;
      }

      #rf-news-slider .rf-slide-item img {
        display: block;
        flex: 0 0 38%;
        width: 38%;
        height: 250px;
        object-fit: cover;
        border-radius: 8px;
        background: #e8edf2;
      }

      #rf-news-slider .rf-slide-info {
        flex: 1;
        min-width: 0;
        align-self: center;
      }

      #rf-news-slider .rf-slide-info h3 {
        margin: 0 0 12px;
        color: #171717;
        font-size: clamp(19px, 2.5vw, 29px);
        font-weight: 800;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      #rf-news-slider .rf-slide-info p {
        margin: 0 0 14px;
        color: #444;
        font-size: 15px;
        line-height: 1.5;
      }

      #rf-news-slider .rf-slide-link {
        display: inline-block;
        color: #b51f2a;
        font-weight: 700;
        text-decoration: underline;
      }

      #rf-news-slider .rf-news-meta,
      #rf-news-slider .rf-status {
        margin: 10px 4px 0;
        color: #343a40;
        font-size: 13px;
      }

      #rf-news-slider .rf-news-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }

      #rf-news-slider .rf-news-controls button {
        border: 0;
        border-radius: 6px;
        padding: 9px 14px;
        background: #b51f2a;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }

      #rf-news-slider .rf-news-controls button:focus-visible,
      #rf-news-slider a:focus-visible {
        outline: 3px solid #1769aa;
        outline-offset: 3px;
      }

      #rf-news-slider img {
        max-width: 100%;
      }

      @keyframes rfNewsFadeIn {
        from { opacity: .6; }
        to { opacity: 1; }
      }

      @media (max-width: 640px) {
        #rf-news-slider { padding: 6px; }

        #rf-news-slider .rf-slide-item,
        #rf-news-slider .rf-slide-item.ativo {
          flex-direction: column;
          gap: 10px;
          padding: 9px;
        }

        #rf-news-slider .rf-slide-item img {
          flex: none;
          width: 100%;
          height: 210px;
        }

        #rf-news-slider .rf-slide-info h3 {
          font-size: 21px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #rf-news-slider .rf-slide-item.ativo {
          animation: none;
        }
      }
    `;

    document.head.appendChild(estilo);
  }

  function prepararSlider() {
    slider = document.getElementById("rf-news-slider");

    if (!slider) {
      console.warn(
        "[Rádio Futebol FM] Não encontrei #rf-news-slider no HTML."
      );
      return false;
    }

    aplicarEstiloNoticias();

    slider.setAttribute("aria-label", "Notícias de futebol");
    slider.setAttribute("aria-live", "polite");

    return true;
  }

  function textoLimpo(valor) {
    var div = document.createElement("div");
    div.innerHTML = String(valor || "");
    return (div.textContent || div.innerText || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function urlSegura(valor) {
    try {
      var url = new URL(valor, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (e) {}
    return "";
  }

  function extrairImagem(item) {
    var imagem = "";

    if (item.thumbnail) imagem = item.thumbnail;
    if (!imagem && item.enclosure && item.enclosure.link) {
      imagem = item.enclosure.link;
    }

    if (!imagem && item.description) {
      var div = document.createElement("div");
      div.innerHTML = item.description;
      var img = div.querySelector("img");
      if (img) imagem = img.getAttribute("src") || "";
    }

    return urlSegura(imagem);
  }

  function imagemAlternativa() {
    // Imagem local opcional; crie este arquivo no repositório
    // se quiser usar uma foto própria como alternativa.
    return "/radiofutebolfm/futebol-placeholder.jpg";
  }

  function montarSlide(item, indice) {
    var artigo = criarElemento("article", "rf-slide-item");
    artigo.setAttribute("role", "group");
    artigo.setAttribute(
      "aria-label",
      "Notícia " + (indice + 1) + " de " + noticias.length
    );

    var img = document.createElement("img");
    img.alt = "Imagem ilustrativa de futebol";
    img.loading = indice === 0 ? "eager" : "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.src = item.imagem || imagemAlternativa();

    img.addEventListener("error", function () {
      if (img.dataset.fallbackUsado) return;
      img.dataset.fallbackUsado = "1";

      // Se a imagem externa falhar, usa a alternativa local.
      if (img.src !== new URL(imagemAlternativa(), location.href).href) {
        img.src = imagemAlternativa();
      }
    });

    var info = criarElemento("div", "rf-slide-info");
    var titulo = criarElemento("h3", "", item.titulo);
    var resumo = criarElemento("p", "", item.resumo || item.titulo);
    var link = criarElemento("a", "rf-slide-link", "Leia a notícia completa");

    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    var meta = criarElemento(
      "div",
      "rf-news-meta",
      item.fonte + (item.data ? " • " + item.data : "")
    );

    info.appendChild(titulo);
    info.appendChild(resumo);
    info.appendChild(link);

    artigo.appendChild(img);
    artigo.appendChild(info);
    artigo.appendChild(meta);

    return artigo;
  }

  function mostrarMensagem(mensagem) {
    if (!slider) return;

    var status = slider.querySelector(".rf-status");

    if (!status) {
      status = criarElemento("p", "rf-status");
      status.setAttribute("role", "status");
      slider.appendChild(status);
    }

    status.textContent = mensagem;
  }

  function renderizarNoticias() {
    if (!slider || !noticias.length) return;

    var fragmento = document.createDocumentFragment();

    noticias.forEach(function (item, indice) {
      fragmento.appendChild(montarSlide(item, indice));
    });

    var controles = criarElemento("div", "rf-news-controls");
    var anterior = criarElemento("button", "", "❮ Anterior");
    var proximo = criarElemento("button", "", "Próxima ❯");
    var contador = criarElemento("span", "rf-status", "");

    anterior.type = "button";
    proximo.type = "button";

    anterior.setAttribute("aria-label", "Notícia anterior");
    proximo.setAttribute("aria-label", "Próxima notícia");

    anterior.addEventListener("click", function () {
      mudarSlide(-1);
    });

    proximo.addEventListener("click", function () {
      mudarSlide(1);
    });

    controles.appendChild(anterior);
    controles.appendChild(contador);
    controles.appendChild(proximo);

    var statusAntigo = slider.querySelector(".rf-status");

    slider.replaceChildren(fragmento, controles);

    if (statusAntigo) {
      // O status anterior será recriado se necessário.
    }

    atualizarSlide();
    iniciarRotacao();
  }

  function atualizarSlide() {
    if (!slider) return;

    var slides = slider.querySelectorAll(".rf-slide-item");

    if (!slides.length) return;

    indiceAtual = (indiceAtual + slides.length) % slides.length;

    slides.forEach(function (slide, indice) {
      var ativo = indice === indiceAtual;
      slide.classList.toggle("ativo", ativo);
      slide.setAttribute("aria-hidden", ativo ? "false" : "true");
    });

    var contador = slider.querySelector(
      ".rf-news-controls .rf-status"
    );

    if (contador) {
      contador.textContent =
        (indiceAtual + 1) + " / " + slides.length;
    }
  }

  function mudarSlide(direcao) {
    indiceAtual += direcao;
    atualizarSlide();
    iniciarRotacao();
  }

  function iniciarRotacao() {
    if (timerSlide) clearInterval(timerSlide);

    if (noticias.length < 2) return;

    timerSlide = setInterval(function () {
      indiceAtual++;
      atualizarSlide();
    }, CONFIG.intervaloSlide);
  }

  async function buscarFonte(fonte) {
    var controlador = new AbortController();
    var timeout = setTimeout(function () {
      controlador.abort();
    }, CONFIG.tempoLimite);

    try {
      var url = CONFIG.proxy + encodeURIComponent(fonte.url);

      var resposta = await fetch(url, {
        method: "GET",
        signal: controlador.signal,
        cache: "no-store"
      });

      if (!resposta.ok) {
        throw new Error("HTTP " + resposta.status);
      }

      var dados = await resposta.json();

      if (dados.status !== "ok" || !Array.isArray(dados.items)) {
        throw new Error("Resposta RSS inválida");
      }

      return dados.items.map(function (item) {
        var link = urlSegura(item.link);
        var titulo = textoLimpo(item.title);
        var resumo = textoLimpo(item.description);

        if (!link || !titulo) return null;

        return {
          titulo: titulo,
          resumo: resumo.slice(0, 260),
          link: link,
          imagem: extrairImagem(item),
          fonte: fonte.nome,
          data: item.pubDate
            ? new Date(item.pubDate).toLocaleDateString("pt-BR")
            : ""
        };
      }).filter(Boolean);

    } finally {
      clearTimeout(timeout);
    }
  }

  async function carregarNoticias() {
    if (carregando || !prepararSlider()) return;

    carregando = true;

    if (!noticias.length) {
      mostrarMensagem("Carregando notícias de futebol...");
    }

    try {
      var resultados = await Promise.allSettled(
        CONFIG.fontes.map(buscarFonte)
      );

      var novas = [];
      var vistos = new Set();

      resultados.forEach(function (resultado) {
        if (resultado.status !== "fulfilled") return;

        resultado.value.forEach(function (item) {
          var chave = item.link;

          if (!vistos.has(chave)) {
            vistos.add(chave);
            novas.push(item);
          }
        });
      });

      if (novas.length) {
        noticias = novas.slice(0, CONFIG.limiteNoticias);
        indiceAtual = 0;
        ultimaAtualizacao = Date.now();
        renderizarNoticias();
        console.info(
          "[Rádio Futebol FM] Notícias carregadas:",
          noticias.length
        );
      } else if (!noticias.length) {
        mostrarMensagem(
          "As notícias não estão disponíveis agora. Tentaremos novamente."
        );
      }

    } catch (erro) {
      console.warn("[Rádio Futebol FM] Falha ao atualizar notícias.", erro);

      if (!noticias.length) {
        mostrarMensagem(
          "Não foi possível carregar as notícias. Nova tentativa programada."
        );
      }

    } finally {
      carregando = false;
    }
  }

  function iniciar() {
    if (!prepararSlider()) return;

    carregarNoticias();

    if (timerAtualizacao) clearInterval(timerAtualizacao);

    timerAtualizacao = setInterval(function () {
      if (document.visibilityState === "visible") {
        carregarNoticias();
      }
    }, CONFIG.intervaloAtualizacao);

    document.addEventListener("visibilitychange", function () {
      if (
        document.visibilityState === "visible" &&
        Date.now() - ultimaAtualizacao > CONFIG.intervaloAtualizacao
      ) {
        carregarNoticias();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
