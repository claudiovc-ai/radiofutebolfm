```javascript
(function () {
  "use strict";

  function atualizarRelogio() {
    var relogio = document.getElementById("rf-relogio");
    var ano = document.getElementById("rf-ano");

    if (relogio) {
      relogio.textContent = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false
      });
    }

    if (ano) {
      ano.textContent = new Date().getFullYear();
    }
  }

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
    var icone = document.getElementById("rf-icone-clima");
    var temperatura = document.getElementById("rf-temperatura");

    if (!icone && !temperatura) return;

    try {
      var url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=-19.9678&longitude=-44.1983" +
        "&current=temperature_2m,weather_code" +
        "&timezone=America%2FSao_Paulo";

      var resposta = await fetch(url, { cache: "no-store" });

      if (!resposta.ok) {
        throw new Error("Clima indisponível");
      }

      var dados = await resposta.json();

      if (!dados.current) {
        throw new Error("Dados indisponíveis");
      }

      var info = climaTexto(dados.current.weather_code);

      if (icone) {
        icone.textContent = info[0];
      }

      if (temperatura) {
        temperatura.textContent =
          info[1] + " • " +
          Math.round(dados.current.temperature_2m) + "°C";
      }
    } catch (erro) {
      if (temperatura) {
        temperatura.textContent = "Clima temporariamente indisponível";
      }
    }
  }

  atualizarRelogio();
  window.setInterval(atualizarRelogio, 1000);

  carregarClima();
  window.setInterval(carregarClima, 10 * 60 * 1000);
})();
```
