
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
      padding: 12px;
      border-radius: 12px;
      background: #f2f5f8;
      background-image:
        linear-gradient(
          rgba(255,255,255,.30),
          rgba(255,255,255,.50)
        ),
        url("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80");
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
    }

    #rf-news-slider .rf-slide-item {
      display: none;
      box-sizing: border-box;
      width: 100%;
      min-height: 300px;
      align-items: stretch;
      gap: 18px;
      padding: 14px;
      border-radius: 10px;
      background: rgba(255,255,255,.94);
      box-shadow: 0 3px 14px rgba(0,0,0,.10);
    }

    #rf-news-slider .rf-slide-item.ativo {
      display: flex;
      animation: rfNewsFadeIn .5s ease;
    }

    #rf-news-slider .rf-slide-item img {
      display: block;
      flex: 0 0 38%;
      width: 38%;
      height: 270px;
      object-fit: cover;
      object-position: center;
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
      font-size: clamp(20px, 2.5vw, 30px);
      font-weight: 800;
      line-height: 1.3;
    }

    #rf-news-slider .rf-slide-info p {
      margin: 0 0 14px;
      color: #444;
      font-size: 16px;
      line-height: 1.55;
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

    @keyframes rfNewsFadeIn {
      from { opacity: .4; }
      to { opacity: 1; }
    }

    @media (max-width: 640px) {
      #rf-news-slider {
        padding: 7px;
      }

      #rf-news-slider .rf-slide-item,
      #rf-news-slider .rf-slide-item.ativo {
        flex-direction: column;
        gap: 12px;
        padding: 10px;
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

