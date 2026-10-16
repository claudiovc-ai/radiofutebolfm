
function aplicarEstiloNoticias() {
  if (document.getElementById("rf-news-custom-style")) return;

  var estilo = document.createElement("style");
  estilo.id = "rf-news-custom-style";

  estilo.textContent = `
    #rf-news-slider {
      position: relative;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      padding: 10px;
      border-radius: 12px;
      background: #eef2f6;
    }

    #rf-news-slider .rf-slide-item {
      display: none;
      box-sizing: border-box;
      width: 100%;
      min-height: 240px;
      align-items: stretch;
      gap: 16px;
      padding: 12px;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

    #rf-news-slider .rf-slide-item.ativo {
      display: flex;
      animation: rfNewsFadeIn .25s ease;
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

    #rf-news-slider img {
      max-width: 100%;
    }

    @keyframes rfNewsFadeIn {
      from { opacity: .6; }
      to { opacity: 1; }
    }

    @media (max-width: 640px) {
      #rf-news-slider {
        padding: 6px;
      }

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
