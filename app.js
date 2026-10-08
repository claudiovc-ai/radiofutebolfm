(function(){
"use strict";

function atualizarRelogio(){
  var el=document.getElementById("rf-relogio");
  if(el) el.textContent=new Date().toLocaleTimeString("pt-BR");
}
atualizarRelogio();
setInterval(atualizarRelogio,1000);

var ano=document.getElementById("rf-ano");
if(ano) ano.textContent=new Date().getFullYear();

function climaTexto(codigo){
  if(codigo===0)return["☀️","Céu limpo"];
  if(codigo===1||codigo===2)return["🌤️","Parcialmente nublado"];
  if(codigo===3)return["☁️","Nublado"];
  if(codigo===45||codigo===48)return["🌫️","Neblina"];
  if(codigo>=51&&codigo<=57)return["🌦️","Garoa"];
  if(codigo>=61&&codigo<=67)return["🌧️","Chuva"];
  if(codigo>=80&&codigo<=82)return["🌧️","Pancadas de chuva"];
  if(codigo>=95)return["⛈️","Trovoada"];
  return["🌤️","Tempo variável"];
}

function carregarClima(){
  var url="https://api.open-meteo.com/v1/forecast?latitude=-19.9678&longitude=-44.1983&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo";
  fetch(url).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(d){
    if(!d.current)throw Error();
    var info=climaTexto(d.current.weather_code);
    var ic=document.getElementById("rf-icone-clima"),temp=document.getElementById("rf-temperatura");
    if(ic)ic.textContent=info[0];
    if(temp)temp.textContent=info[1]+" • "+Math.round(d.current.temperature_2m)+"°C";
  }).catch(function(){
    var temp=document.getElementById("rf-temperatura");
    if(temp)temp.textContent="Clima indisponível";
  });
}
carregarClima();
setInterval(carregarClima,900000);

/*
 * Notícias:
 * O site mostra somente chamadas/resumos curtos e envia o visitante
 * para a publicação original. Não copia o texto integral dos artigos.
 */
var feed="https://news.google.com/rss/search?q=futebol%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419";
var rss="https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(feed);
var slider=document.getElementById("rf-news-slider");
if(!slider)return;

fetch(rss).then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(d){
  if(!d.items||!d.items.length)throw Error();
  slider.innerHTML="";
  d.items.slice(0,8).forEach(function(item,index){
    var artigo=document.createElement("article");
    artigo.className="rf-slide-item"+(index===0?" ativo":"");

    var imagem=(item.thumbnail||(item.enclosure&&item.enclosure.link)||"https://via.placeholder.com/900x310?text=Radio+Futebol+FM");
    var titulo=item.title||"Notícia de futebol";
    var texto=(item.description||"Confira a notícia completa na fonte original.")
      .replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim().substring(0,180);
    if(texto.length===180)texto+="…";

    var img=document.createElement("img");
    img.src=imagem;img.alt=titulo;img.loading=index===0?"eager":"lazy";img.width=900;img.height=310;
    img.onerror=function(){this.src="https://via.placeholder.com/900x310?text=Radio+Futebol+FM";};

    var info=document.createElement("div");info.className="rf-slide-info";
    var h=document.createElement("h3");h.textContent=titulo;
    var p=document.createElement("p");p.textContent=texto;
    var a=document.createElement("a");a.className="rf-slide-link";a.href=item.link||"#";a.target="_blank";a.rel="noopener noreferrer";a.textContent="Ler notícia original";
    info.appendChild(h);info.appendChild(p);info.appendChild(a);
    artigo.appendChild(img);artigo.appendChild(info);slider.appendChild(artigo);
  });

  var slides=slider.querySelectorAll(".rf-slide-item"),pos=0;
  if(slides.length>1)setInterval(function(){
    slides[pos].classList.remove("ativo");pos=(pos+1)%slides.length;slides[pos].classList.add("ativo");
  },6000);
}).catch(function(){
  slider.innerHTML='<div class="rf-status">Não foi possível carregar as notícias agora.</div>';
});
})();
