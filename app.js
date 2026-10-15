
/* Rádio Futebol FM — relógio, clima e notícias automáticas */
(function () {
  "use strict";

  var slider = document.getElementById("rf-news-slider");
  var botao = document.getElementById("rf-news-refresh");
  var timerCarrossel = null;
  var carregando = false;

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
    if (codigo <= 57 && codigo >= 51) return ["🌦️", "Garoa"];
    if (codigo <= 67 && codigo >= 61) return ["🌧️", "Chuva"];
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
        temperatura.textContent = "Clima temporariamente indisponível";
      }
    }
  }

  carregarClima();
  setInterval(carregarClima, 15 * 60 * 1000);

  // Notícias de futebol: um único carregador
  if (!slider) return;

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
      "https://placehold.co/900x310/111111/ffffff?text=Radio+Futebol+FM";
    imagem.alt = textoLimpo(item.title) || "Notícia de futebol";
    imagem.loading = "lazy";
    imagem.width = 900;
    imagem.height = 310;
    imagem.onerror = function () {
      this.onerror = null;
      this.src =
        "https://placehold.co/900x310/111111/ffffff?text=Radio+Futebol+FM";
    };

    var info = document.createElement("div");
    info.className = "rf-slide-info";

    var titulo = document.createElement("h3");
    titulo.textContent = textoLimpo(item.title) || "Notícia de futebol";

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
      }, 7000);
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
        if (!item || !item.title || !urlValida(item.link)) return false;

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
        "Notícias consultadas às " +
        new Date().toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        });

      slider.appendChild(atualizacao);
      iniciarCarrossel();

    } catch (erro) {
      if (!slider.querySelector(".rf-slide-item")) {
        mostrarStatus(
          "Não foi possível carregar as notícias agora. " +
          "Verifique sua conexão ou tente novamente em alguns minutos."
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
  setInterval(carregarNoticias, 15 * 60 * 1000);
})();
