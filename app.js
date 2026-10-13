```javascript
/* =====================================================
   RÁDIO FUTEBOL FM — APP.JS
   Relógio • Clima de Betim • Notícias automáticas
   ===================================================== */

(function () {
  "use strict";

  var temporizadorNoticias = null;
  var temporizadorClima = null;
  var temporizadorRelogio = null;
  var indiceSlide = 0;
  var carregandoNoticias = false;

  var FALLBACK_IMAGEM =
    "https://placehold.co/900x310/111111/ffffff?text=Radio+Futebol+FM";

  var FEED =
    "https://news.google.com/rss/search?q=futebol%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419";

  /* =====================================================
     RELÓGIO E ANO
     ===================================================== */

  function atualizarRelogio() {
    var agora = new Date();

    var relogio =
      document.getElementById("rf-relogio") ||
      document.getElementById("rfClock");

    var ano =
      document.getElementById("rf-ano") ||
      document.getElementById("rfYear");

    if (relogio) {
      relogio.textContent = agora.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false
      });
    }

    if (ano) {
      ano.textContent = String(
        new Date().getFullYear()
      );
    }
  }

  atualizarRelogio();

  temporizadorRelogio = window.setInterval(
    atualizarRelogio,
    1000
  );

  /* =====================================================
     CLIMA DE BETIM — MG
     ===================================================== */

  function climaTexto(codigo) {
    if (codigo === 0) return ["☀️", "Céu limpo"];
    if (codigo === 1) return ["🌤️", "Predominantemente limpo"];
    if (codigo === 2) return ["⛅", "Parcialmente nublado"];
    if (codigo === 3) return ["☁️", "Nublado"];
    if (codigo === 45 || codigo === 48) return ["🌫️", "Neblina"];
    if (codigo >= 51 && codigo <= 57) return ["🌦️", "Garoa"];
    if (codigo >= 61 && codigo <= 67) return ["🌧️", "Chuva"];
    if (codigo >= 71 && codigo <= 77) return ["🌨️", "Neve"];
    if (codigo >= 80 && codigo <= 82) return ["🌧️", "Pancadas de chuva"];
    if (codigo >= 85 && codigo <= 86) return ["🌨️", "Pancadas de neve"];
    if (codigo >= 95) return ["⛈️", "Trovoadas"];

    return ["🌤️", "Tempo variável"];
  }

  async function carregarClima() {
    var icone =
      document.getElementById("rf-icone-clima") ||
      document.getElementById("rfWeatherIcon");

    var temperatura =
      document.getElementById("rf-temperatura") ||
      document.getElementById("rfWeather");

    if (!icone && !temperatura) return;

    try {
      var url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=-19.9678" +
        "&longitude=-44.1983" +
        "&current=temperature_2m,weather_code" +
        "&timezone=America%2FSao_Paulo";

      var resposta = await fetch(url, {
        cache: "no-store"
      });

      if (!resposta.ok) {
        throw new Error("Clima indisponível");
      }

      var dados = await resposta.json();

      if (
        !dados.current ||
        typeof dados.current.temperature_2m !== "number"
      ) {
        throw new Error("Dados de clima inválidos");
      }

      var info = climaTexto(
        dados.current.weather_code
      );

      if (icone) {
        icone.textContent = info[0];
      }

      if (temperatura) {
        temperatura.textContent =
          info[1] +
          " • " +
          Math.round(dados.current.temperature_2m) +
          "°C";
      }
    } catch (erro) {
      if (
        temperatura &&
        !temperatura.textContent.trim()
      ) {
        temperatura.textContent =
          "Clima temporariamente indisponível";
      }
    }
  }

  carregarClima();

  temporizadorClima = window.setInterval(
    carregarClima,
    10 * 60 * 1000
  );

  /* =====================================================
     NOTÍCIAS AUTOMÁTICAS DE FUTEBOL
     Compatível com os IDs antigos e novos
     ===================================================== */

  var slider =
    document.getElementById("rf-news-slider") ||
    document.getElementById("rfNewsSlider");

  var botaoAtualizar =
    document.getElementById("rf-news-refresh") ||
    document.getElementById("rfNewsRefresh");

  var botaoAnterior =
    document.getElementById("rfPrev");

  var botaoProximo =
    document.getElementById("rfNext");

  var pontos =
    document.getElementById("rfDots");

  if (!slider) {
    return;
  }

  function urlValida(valor) {
    try {
      var url = new URL(valor);

      return (
        url.protocol === "https:" ||
        url.protocol === "http:"
      );
    } catch (erro) {
      return false;
    }
  }

  function textoSimples(valor) {
    var temporario = document.createElement("div");

    temporario.textContent = String(valor || "");

    return (temporario.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extrairResumo(valor) {
    var temporario = document.createElement("div");

    temporario.innerHTML = String(valor || "");

    return (
      temporario.textContent ||
      temporario.innerText ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  function limparSlider() {
    while (slider.firstChild) {
      slider.removeChild(slider.firstChild);
    }

    if (pontos) {
      pontos.replaceChildren();
    }
  }

  function mostrarStatus(mensagem) {
    limparSlider();

    var status = document.createElement("div");

    status.className = "rf-status";
    status.textContent = mensagem;

    slider.appendChild(status);
  }

  function criarSlide(item, indice) {
    var artigo = document.createElement("article");

    artigo.className =
      "rf-slide-item" +
      (indice === 0 ? " ativo" : "");

    var titulo =
      textoSimples(item.title) ||
      "Notícia de futebol";

    var destino = urlValida(item.link)
      ? item.link
      : "";

    var resumo = extrairResumo(
      item.description || item.content || ""
    );

    var img = document.createElement("img");

    img.src = FALLBACK_IMAGEM;
    img.alt = "Rádio Futebol FM";
    img.loading = indice === 0 ? "eager" : "lazy";
    img.width = 900;
    img.height = 310;
    img.decoding = "async";

    img.onerror = function () {
      this.onerror = null;
      this.src = FALLBACK_IMAGEM;
    };

    var info = document.createElement("div");
    info.className = "rf-slide-info";

    var h3 = document.createElement("h3");
    h3.textContent = titulo;

    var p = document.createElement("p");
    p.textContent =
      resumo ||
      "Acesse a publicação original para conferir os detalhes.";

    info.appendChild(h3);
    info.appendChild(p);

    if (destino) {
      var link = document.createElement("a");

      link.className = "rf-slide-link";
      link.href = destino;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Ler notícia original";

      info.appendChild(link);
    }

    artigo.appendChild(img);
    artigo.appendChild(info);

    return artigo;
  }

  function atualizarPontos(slides) {
    if (!pontos) return;

    pontos.replaceChildren();

    slides.forEach(function (slide, indice) {
      var ponto = document.createElement("button");

      ponto.type = "button";
      ponto.className =
        "rf-dot" + (indice === 0 ? " ativo" : "");

      ponto.setAttribute(
        "aria-label",
        "Mostrar notícia " + (indice + 1)
      );

      ponto.addEventListener("click", function () {
        mostrarSlide(indice);
      });

      pontos.appendChild(ponto);
    });
  }

  function mostrarSlide(novoIndice) {
    var slides =
      slider.querySelectorAll(".rf-slide-item");

    if (!slides.length) return;

    indiceSlide =
      (novoIndice + slides.length) % slides.length;

    slides.forEach(function (slide, indice) {
      slide.classList.toggle(
        "ativo",
        indice === indiceSlide
      );
    });

    if (pontos) {
      var botoes = pontos.querySelectorAll("button");

      botoes.forEach(function (botao, indice) {
        botao.classList.toggle(
          "ativo",
          indice === indiceSlide
        );
      });
    }
  }

  function iniciarCarrossel() {
    if (temporizadorNoticias) {
      window.clearInterval(temporizadorNoticias);
      temporizadorNoticias = null;
    }

    var slides =
      slider.querySelectorAll(".rf-slide-item");

    indiceSlide = 0;

    if (!slides.length) return;

    mostrarSlide(0);
    atualizarPontos(slides);

    if (slides.length < 2) return;

    temporizadorNoticias = window.setInterval(
      function () {
        mostrarSlide(indiceSlide + 1);
      },
      6000
    );
  }

  if (botaoAnterior) {
    botaoAnterior.addEventListener("click", function () {
      mostrarSlide(indiceSlide - 1);
    });
  }

  if (botaoProximo) {
    botaoProximo.addEventListener("click", function () {
      mostrarSlide(indiceSlide + 1);
    });
  }

  async function buscarNoticias() {
    if (carregandoNoticias) return;

    carregandoNoticias = true;

    if (botaoAtualizar) {
      botaoAtualizar.disabled = true;
      botaoAtualizar.textContent = "Atualizando...";
    }

    try {
      var endpoint =
        "https://api.rss2json.com/v1/api.json?rss_url=" +
        encodeURIComponent(FEED);

      var resposta = await fetch(endpoint, {
        cache: "no-store"
      });

      if (!resposta.ok) {
        throw new Error("Serviço de notícias indisponível");
      }

      var dados = await resposta.json();

      if (
        dados.status !== "ok" ||
        !Array.isArray(dados.items) ||
        !dados.items.length
      ) {
        throw new Error("Nenhuma notícia disponível");
      }

      var noticias = dados.items
        .filter(function (item) {
          return (
            item &&
            item.title &&
            urlValida(item.link)
          );
        })
        .slice(0, 8);

      if (!noticias.length) {
        throw new Error("Nenhuma notícia válida");
      }

      limparSlider();

      noticias.forEach(function (item, indice) {
        slider.appendChild(
          criarSlide(item, indice)
        );
      });

      iniciarCarrossel();

      var atualizado = document.createElement("p");

      atualizado.className = "rf-news-meta";
      atualizado.textContent =
        "Última consulta: " +
        new Date().toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        });

      slider.appendChild(atualizado);
    } catch (erro) {
      if (!slider.querySelector(".rf-slide-item")) {
        mostrarStatus(
          "As notícias estão temporariamente indisponíveis. " +
          "Tente novamente em alguns minutos."
        );
      }
    } finally {
      carregandoNoticias = false;

      if (botaoAtualizar) {
        botaoAtualizar.disabled = false;
        botaoAtualizar.textContent =
          "Atualizar notícias";
      }
    }
  }

  if (botaoAtualizar) {
    botaoAtualizar.addEventListener(
      "click",
      buscarNoticias
    );
  }

  buscarNoticias();

  window.setInterval(
    buscarNoticias,
    15 * 60 * 1000
  );
})();
```
