const rfFeeds = [
  "https://g1.globo.com/dynamo/rss2.xml",
  "https://g1.globo.com/dynamo/brasil/rss2.xml",
  "https://g1.globo.com/dynamo/minas-gerais/rss2.xml",
  "https://g1.globo.com/dynamo/mundo/rss2.xml",
  "https://g1.globo.com/dynamo/economia/rss2.xml",
  "https://g1.globo.com/dynamo/tecnologia/rss2.xml",
  "https://g1.globo.com/dynamo/educacao/rss2.xml",
  "https://g1.globo.com/dynamo/ciencia-e-saude/rss2.xml",
  "https://g1.globo.com/dynamo/natureza/rss2.xml",
  "https://g1.globo.com/dynamo/musica/rss2.xml"
];

let rfNews = [];
let rfCurrent = 0;
let rfTimer = null;

function rfUpdateClock() {
  const el = document.getElementById("clock");
  const year = document.getElementById("year");

  const now = new Date();

  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  const date = now.toLocaleDateString("pt-BR");

  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  if (el) {
    el.textContent =
      `${time} • ${days[now.getDay()]} - ${date}`;
  }

  if (year) {
    year.textContent = now.getFullYear();
  }
}

rfUpdateClock();

setInterval(rfUpdateClock, 1000);


async function rfLoadWeather() {
  const el = document.getElementById("weather");

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=-19.9678" +
      "&longitude=-44.1983" +
      "&current=temperature_2m,relative_humidity_2m" +
      "&timezone=America%2FSao_Paulo";

    const response = await fetch(url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("weather");
    }

    const data = await response.json();
    const current = data.current || {};

    if (el) {
      el.textContent =
        `🌤️ Betim - MG ${current.temperature_2m ?? "--"} °C • Umidade ${current.relative_humidity_2m ?? "--"}%`;
    }

  } catch (error) {

    if (el) {
      el.textContent = "🌤️ Betim - MG";
    }

  }
}

rfLoadWeather();

setInterval(rfLoadWeather, 600000);


function rfCleanText(value) {

  const div = document.createElement("div");

  div.innerHTML = value || "";

  return (
    div.textContent ||
    div.innerText ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();
}


function rfGetImage(item) {

  if (
    item &&
    item.enclosure &&
    item.enclosure.link
  ) {
    return item.enclosure.link;
  }

  if (item && item.thumbnail) {
    return item.thumbnail;
  }

  const html =
    item && item.description
      ? item.description
      : "";

  const match =
    html.match(
      /<img[^>]+src=["']([^"']+)["']/i
    );

  return match
    ? match[1]
    : "https://via.placeholder.com/900x500/222/ffffff?text=Radio+Futebol+FM";
}


async function rfFetchFeed(feed) {

  try {

    const api =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feed);

    const response = await fetch(api, {
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return Array.isArray(data.items)
      ? data.items
      : [];

  } catch (error) {

    return [];

  }
}


async function rfLoadNews() {

  const slider =
    document.getElementById("newsSlider");

  try {

    const batches =
      await Promise.all(
        rfFeeds.map(rfFetchFeed)
      );

    const map = new Map();

    batches
      .flat()
      .forEach(item => {

        const link =
          item.link || "";

        const title =
          rfCleanText(item.title);

        if (
          !link ||
          !title ||
          map.has(link)
        ) {
          return;
        }

        map.set(link, {

          title,

          description:
            rfCleanText(
              item.description ||
              item.content
            ).slice(0, 260),

          link,

          image:
            rfGetImage(item),

          date:
            item.pubDate || ""

        });

      });


    rfNews =
      Array.from(map.values())
        .sort((a, b) => {

          const da =
            new Date(a.date).getTime() || 0;

          const db =
            new Date(b.date).getTime() || 0;

          return db - da;

        })
        .slice(0, 30);


    rfCurrent = 0;

    rfRenderNews();

  } catch (error) {

    if (slider) {

      slider.innerHTML =
        '<div class="loading">' +
        'Não foi possível carregar as notícias agora. ' +
        'Tente novamente em alguns minutos.' +
        '</div>';

    }

  }
}


function rfRenderNews() {

  const slider =
    document.getElementById("newsSlider");

  const dots =
    document.getElementById("dots");

  if (!rfNews.length) {

    slider.innerHTML =
      '<div class="loading">' +
      'Nenhuma notícia disponível no momento.' +
      '</div>';

    dots.innerHTML = "";

    return;
  }


  slider.innerHTML =
    rfNews.map((item, index) => {

      const safeImage =
        item.image
          .replace(/"/g, "&quot;");

      const safeTitle =
        item.title
          .replace(/"/g, "&quot;");

      return `
        <article class="slide ${index === rfCurrent ? "active" : ""}">

          <img
            class="slide-image"
            src="${safeImage}"
            alt="${safeTitle}"
            loading="${index === 0 ? "eager" : "lazy"}"
            onerror="this.src='https://via.placeholder.com/900x500/222/ffffff?text=Radio+Futebol+FM'"
          >

          <div class="slide-content">

            <h3>
              ${item.title}
            </h3>

            <p>
              ${item.description || "Confira a notícia completa na publicação original."}
            </p>

            <a
              href="${item.link}"
              target="_blank"
              rel="noopener noreferrer">

              Ler notícia original

            </a>

          </div>

        </article>
      `;

    }).join("");


  dots.innerHTML =
    rfNews.map((_, index) => {

      return `
        <button
          class="dot ${index === rfCurrent ? "active" : ""}"
          type="button"
          aria-label="Notícia ${index + 1}"
          onclick="rfGoTo(${index})">
        </button>
      `;

    }).join("");
}


function rfGoTo(index) {

  if (!rfNews.length) {
    return;
  }

  rfCurrent =
    (index + rfNews.length) %
    rfNews.length;

  rfRenderNews();
}


function rfNext() {

  rfGoTo(rfCurrent + 1);

}


function rfPrev() {

  rfGoTo(rfCurrent - 1);

}


const nextButton =
  document.getElementById("next");

const prevButton =
  document.getElementById("prev");


if (nextButton) {
  nextButton.addEventListener(
    "click",
    rfNext
  );
}


if (prevButton) {
  prevButton.addEventListener(
    "click",
    rfPrev
  );
}


function rfStartSlider() {

  clearInterval(rfTimer);

  rfTimer =
    setInterval(
      rfNext,
      30000
    );
}


rfLoadNews()
  .then(rfStartSlider);


setInterval(
  rfLoadNews,
  300000
);
