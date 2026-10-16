
/* Rádio Futebol FM — relógio, clima e notícias automáticas */
(function () {
  "use strict";

  var slider = document.getElementById("rf-news-slider");
  var botao = document.getElementById("rf-news-refresh");
  var timerCarrossel = null;
  var carregando = false;

  // Intervalos de 7 minutos
  var INTERVALO_NOTICIAS = 7 * 60 * 1000;
  var INTERVALO_SLIDE = 7 * 60 * 1000;

  // Fundo claro e notícias em destaque
  function aplicarEstiloNoticias() {
    if (document.getElementById("rf-news-custom-style")) return;

    var estilo = document.createElement("style");
    estilo.id = "rf-news-custom-style";
    estilo.textContent = `
      #rf-news-slider {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        padding: 14px;
        border-radius: 14px;
        color: #202124;
        background-color: #f3f6f9;
        background-image:
          linear-gradient(
            rgba(255,255,255,.88),
            rgba(255,255,255,.94)
          ),
          url("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80");
        background-position: center;
        background-size: cover;
      }

      #rf-news-slider .rf-slide-item {
        display: none;
        box-sizing: border-box;
        align-items: center;
        gap: 18px;
        width: 100%;
        padding: 14px;
        border: 1px solid #e3e7eb;
        border-radius: 12px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 4px 18px rgba(20,30,45,.08);
      }

      #rf-news-slider .rf-slide-item.ativo {
        display: flex;
        animation: rfNewsFadeIn .45s ease;
      }

      #rf-news-slider .rf-slide-item img {
        display: block;
        flex: 0 0 34%;
        width: 34%;
        max-width: 360px;
        height: 220px;
        object-fit: cover;
        border-radius: 9px;
        background: #e9edf2;
      }

      #rf-news-slider .rf-slide-info {
        min-width: 0;
        flex: 1 1 auto;
      }

      #rf-news-slider .rf-slide-info h3 {
        margin: 0 0 10px;
        color: #17191c;
        font-size: clamp(1.1rem, 2.2vw, 1.65rem);
        line-height: 1.35;
        font-weight: 800;
      }

      #rf-news-slider .rf-slide-info p {
        margin: 0 0 12px;
        color: #454b54;
        font-size: 1rem;
        line-height: 1.55;
      }

      #rf-news-slider .rf-slide-link {
        display: inline-block;
        color: #b51f2a;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      #rf-news-slider .rf-news-meta,
      #rf-news-slider .rf-status {
        margin: 10px 4px 0;
        color: #4b5563;
        font-size: .85rem;
      }

      @keyframes rfNewsFadeIn {
        from {
          opacity: .35;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 640px) {
        #rf-news-slider {
          padding: 9px;
        }

        #rf-news-slider .rf-slide-item,
        #rf-news-slider .rf-slide-item.ativo {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          padding: 10px;
        }

        #rf-news-slider .rf-slide-item img {
          flex: 0 0 auto;
          width: 100%;
          max-width: none;
          height: 185px;
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

  // Relógio de Brasília e ano do rodapé
  function atualizarRelogio() {
    var agora = new Date();
    var relogio = document.getElementById("rf-relogio");
    var ano = document.getElementById("rf-ano");

    if (relogio) {
      relogio.textContent = agora.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    }

    if (ano) ano.textContent = agora.getFullYear();
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  // Clima de Betim - MG
  function climaTexto(codigo) {
    if (codigo === 0) return ["☀️", "Céu limpo"];
    if (codigo <= 2) return ["🌤️", "Parcialmente nublado"];
    if (codigo === 3) return ["☁️", "Nublado"];
    if (codigo === 45 || codigo === 48) return ["🌫️", "Neblina"];
    if (codigo >= 51 && codigo <= 57) return ["🌦️", "Garoa"];
    if (codigo >= 61 && codigo <= 67) return ["🌧️", "Chuva"];
    if (codigo >= 71 && codigo <= 77) return ["🌨️", "Tempo frio"];
    if (codigo >= 80 && codigo <= 82) return ["🌧️", "Pancadas de chuva"];
    if (codigo >= 95) return ["⛈️", "Trovoadas"];
    return ["🌤️", "Tempo variável"];
  }

  async function carregarClima() {
    var temperatura = document.getElementById("rf-temperatura");
    var icone = document.getElementById("rf-icone-clima");

    try {
      var url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=-19.9678&longitude=-44.1983" +
        "&current=temperature_2m,weather_code" +
        "&timezone=America%2FSao_Paulo";

      var resposta = await fetch(url, { cache: "no-store" });
      if (!resposta.ok) throw new Error("Clima indisponível");

      var dados = await resposta.json();
      if (!dados.current) throw new Error("Sem dados");

      var info = climaTexto(Number(dados.current.weather_code));

      if (icone) icone.textContent = info[0];

      if (temperatura) {
        temperatura.textContent =
          "Betim–MG: " + info[1] + " • " +
          Math.round(dados.current.temperature_2m) + "°C";
      }
    } catch (erro) {
      if (temperatura) {
        temperatura.textContent =
          "Clima temporariamente indisponível";
      }
    }
  }

  carregarClima();
  setInterval(carregarClima, 15 * 60 * 1000);

  // Notícias de futebol
  if (!slider) return;

  aplicarEstiloNoticias();

  var feeds = [
    "https://news.google.com/rss/search?q=futebol+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    "https://news.google.com/rss/search?q=Brasileir%C3%A3o&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    "https://news.google.com/rss/search?q=Flamengo+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    "https://news.google.com/rss/search?q=Atl%C3%A9tico+Mineiro+OR+Cruzeiro&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    "https://news.google.com/rss/search?q=Internacional+OR+Am%C3%A9rica+Mineiro&hl=pt-BR&gl=BR&ceid=BR:pt-419"
  ];

  function textoLimpo(valor) {
    var el = document.createElement("div");
    el.innerHTML = String(valor || "");
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function urlValida(valor) {
    try {
      var url = new URL(valor);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (erro) {
      return false;
    }
  }

  function mostrarStatus(mensagem) {
    slider.textContent = "";

    var aviso = document.createElement("p");
    aviso.className = "rf-status";
    aviso.textContent = mensagem;
    slider.appendChild(aviso);
  }

  async function buscarFeed(feed) {
    var endpoint =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feed);

    var resposta = await fetch(endpoint, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Falha ao consultar feed");

    var dados = await resposta.json();

    if (dados.status !== "ok" || !Array.isArray(dados.items)) {
      throw new Error("Feed indisponível");
    }

    return dados.items;
  }

  function criarNoticia(item) {
    var artigo = document.createElement("article");
    artigo.className = "rf-slide-item";

    var imagem = document.createElement("img");
    imagem.src =
      item.thumbnail ||
      (item.enclosure && item.enclosure.link) ||
      "https://placehold.co/900x310/e9edf2/343a40?text=Radio+Futebol+FM";

    imagem.alt = textoLimpo(item.title) || "Notícia de futebol";
    imagem.loading = "lazy";
    imagem.width = 900;
    imagem.height = 310;

    imagem.onerror = function () {
      this.onerror = null;
      this.src =
        "https://placehold.co/900x310/e9edf2/343a40?text=Radio+Futebol+FM";
    };

    var info = document.createElement("div");
    info.className = "rf-slide-info";

    var titulo = document.createElement("h3");
    titulo.textContent =
      textoLimpo(item.title) || "Notícia de futebol";

    var resumo = document.createElement("p");
    resumo.textContent =
      textoLimpo(item.description || item.content).slice(0, 200) ||
      "Leia os detalhes na publicação original.";

    info.appendChild(titulo);
    info.appendChild(resumo);

    if (urlValida(item.link)) {
      var link = document.createElement("a");
      link.className = "rf-slide-link";
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Ler notícia original ↗";
      info.appendChild(link);
    }

    artigo.appendChild(imagem);
    artigo.appendChild(info);

    return artigo;
  }

  function iniciarCarrossel() {
    if (timerCarrossel) clearInterval(timerCarrossel);

    var slides = slider.querySelectorAll(".rf-slide-item");
    if (!slides.length) return;

    var posicao = 0;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("ativo", i === 0);
    });

    if (slides.length > 1) {
      timerCarrossel = setInterval(function () {
        slides[posicao].classList.remove("ativo");
        posicao = (posicao + 1) % slides.length;
        slides[posicao].classList.add("ativo");
      }, INTERVALO_SLIDE);
    }
  }

  async function carregarNoticias() {
    if (carregando) return;

    carregando = true;

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Atualizando...";
    }

    try {
      var resultados = await Promise.allSettled(
        feeds.map(buscarFeed)
      );

      var todas = [];

      resultados.forEach(function (resultado) {
        if (resultado.status === "fulfilled") {
          todas = todas.concat(resultado.value);
        }
      });

      var vistas = {};

      var noticias = todas.filter(function (item) {
        if (!item || !item.title || !urlValida(item.link)) {
          return false;
        }

        var chave = textoLimpo(item.title).toLowerCase();

        if (vistas[chave]) return false;

        vistas[chave] = true;
        return true;
      }).slice(0, 12);

      if (!noticias.length) {
        throw new Error("Nenhuma notícia disponível");
      }

      slider.textContent = "";

      noticias.forEach(function (item) {
        slider.appendChild(criarNoticia(item));
      });

      var atualizacao = document.createElement("p");
      atualizacao.className = "rf-news-meta";
      atualizacao.textContent =
        "Última consulta às " +
        new Date().toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        }) +
        " • atualização automática a cada 7 minutos";

      slider.appendChild(atualizacao);

      iniciarCarrossel();

    } catch (erro) {
      if (!slider.querySelector(".rf-slide-item")) {
        mostrarStatus(
          "Não foi possível carregar as notícias agora. " +
          "Tente novamente em alguns minutos."
        );
      }
    } finally {
      carregando = false;

      if (botao) {
        botao.disabled = false;
        botao.textContent = "Atualizar notícias";
      }
    }
  }

  if (botao) {
    botao.addEventListener("click", carregarNoticias);
  }

  carregarNoticias();
  setInterval(carregarNoticias, INTERVALO_NOTICIAS);
})();
