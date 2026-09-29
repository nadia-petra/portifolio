/* =====================================================================
   PAINEL DA NADIA PETRA
   Tudo que acontece no admin mora aqui. A primeira coisa que o script
   faz é conferir se existe sessão aberta: sem sessão, volta pro login,
   e a página só aparece depois dessa conferência.
   ===================================================================== */
(async function () {
  "use strict";

  /* ================= 1. CONFERIR A SESSÃO ================= */
  var banco = window.banco;
  var telaEspera = document.querySelector(".carregando-tela");
  if (!banco) {
    telaEspera.textContent = "Não consegui carregar a conexão com o banco. Confira a internet e recarregue a página.";
    return;
  }
  var sessao = null;
  try {
    var r = await banco.auth.getSession();
    sessao = r && r.data ? r.data.session : null;
  } catch (e) { sessao = null; }
  if (!sessao) { location.replace("../login/"); return; }
  banco.auth.onAuthStateChange(function (evento, s) {
    if (evento === "SIGNED_OUT" || !s) location.replace("../login/");
  });
  document.body.classList.remove("conferindo");

  // Marca este navegador como seu, pra o portfólio não contar as suas próprias visitas
  try { localStorage.setItem("np-sou-eu", "1"); } catch (e) {}

  /* ================= 2. FERRAMENTAS ================= */
  var EMAIL_ADMIN = window.NP_EMAIL_ADMIN || "nadiapetraugc@gmail.com";
  var $ = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); };
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Os textos da biblioteca têm <b> e <em>: só essas duas marcações passam
  function htmlSeguro(s) { return esc(s).replace(/&lt;(\/?)(b|em)&gt;/g, "<$1$2>"); }
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function reais(v) { return moeda.format(num(v)); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function hojeISO() { return iso(new Date()); }
  function deISO(s) { var p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function diasAte(s) { return Math.round((deISO(s) - deISO(hojeISO())) / 86400000); }
  function dataBR(s) { if (!s) return ""; var p = String(s).slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }
  function idYouTube(link) {
    var m = String(link || "").match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }

  var ICONES = {
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    olho: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    olhoFechado: '<path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    lixo: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    estrela: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    zap: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
    esquerda: '<path d="M15 18l-6-6 6-6"/>',
    direita: '<path d="M9 18l6-6-6-6"/>',
    seta: '<path d="M9 18l6-6-6-6"/>',
    externo: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    check: '<path d="M20 6L9 17l-5-5"/>'
  };
  function ic(nome, estilo) {
    return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"' + (estilo ? ' style="' + estilo + '"' : "") + ">" + ICONES[nome] + "</svg>";
  }

  var toastTimer;
  function toast(msg, erro) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("erro", !!erro);
    t.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("visivel"); }, erro ? 5000 : 2400);
  }

  /* ================= 3. AVISOS (quando falta tabela ou campo) ================= */
  var avisosMostrados = {};
  function avisar(chave, html) {
    if (avisosMostrados[chave]) return;
    avisosMostrados[chave] = true;
    var d = document.createElement("div");
    d.className = "aviso";
    d.innerHTML = "<span>" + html + '</span><button type="button" aria-label="Fechar aviso">×</button>';
    d.querySelector("button").addEventListener("click", function () { d.remove(); });
    $("#avisos").appendChild(d);
  }
  function explicarErro(tabela, erro) {
    var c = erro && erro.code, m = String((erro && erro.message) || "");
    if (c === "PGRST205" || c === "42P01" || /could not find the table|does not exist/i.test(m) && !/column/i.test(m))
      return "Não encontrei a tabela <b>" + esc(tabela) + "</b> no banco. Rode o arquivo banco.sql no SQL Editor do Supabase. O resto do painel continua funcionando.";
    if (c === "PGRST204" || c === "42703" || /column/i.test(m))
      return "Faltou um campo na tabela <b>" + esc(tabela) + "</b> (" + esc(m) + "). Rode o banco.sql de novo para completar. O resto continua funcionando.";
    if (c === "42501" || /permission|row-level|jwt/i.test(m))
      return "Sem permissão na tabela <b>" + esc(tabela) + "</b>. Confira se você entrou com " + esc(EMAIL_ADMIN) + " e se o banco.sql foi rodado.";
    if (/fetch|network|failed/i.test(m))
      return "Sem conexão com o banco agora. Confira a internet e recarregue a página.";
    return "Não consegui usar a tabela <b>" + esc(tabela) + "</b>: " + esc(m);
  }
  function mensagemCurta(erro) {
    var m = String((erro && erro.message) || "");
    if (/could not find the table|PGRST205/i.test(m) || (erro && erro.code === "PGRST205")) return "A tabela ainda não existe no banco. Rode o banco.sql.";
    if (/column/i.test(m)) return "Falta um campo no banco. Rode o banco.sql de novo.";
    if (/row-level|permission/i.test(m)) return "Sem permissão. Confira se entrou com a conta certa.";
    if (/check constraint/i.test(m)) return "Algum campo está com um valor que o banco não aceita.";
    if (/fetch|network/i.test(m)) return "Sem conexão. Confira a internet.";
    return "Não deu certo: " + m;
  }

  /* ================= 4. CARREGAR OS DADOS ================= */
  var CAMPOS = {
    videos: ["titulo", "link", "nicho", "formato", "marca", "destaque", "ordem", "visivel"],
    marcas: ["nome", "instagram", "email", "telefone", "situacao", "obs", "ultimo_contato"],
    calendario: ["titulo", "marca", "tipo", "data", "status"],
    campanhas: ["campanha", "cliente", "tipo", "status", "qtd", "valor", "prazo", "pagamento", "ativa", "favorita"],
    marcados: ["chave"],
    visitas: ["data", "pagina", "origem"]
  };
  var estado = { videos: [], marcas: [], calendario: [], campanhas: [], marcados: {}, visitas: [], ok: {} };

  // Tenta a consulta completa; se faltar algum campo usado na ordenação, tenta a simples
  async function carregar(tabela, completa, simples) {
    try {
      var r1 = await completa(banco.from(tabela));
      if (r1.error && simples && (r1.error.code === "42703" || /column/i.test(r1.error.message || ""))) {
        avisar("c:" + tabela, explicarErro(tabela, r1.error));
        r1 = await simples(banco.from(tabela));
      }
      if (r1.error) throw r1.error;
      estado.ok[tabela] = true;
      var linhas = r1.data || [];
      if (linhas.length) {
        var faltam = CAMPOS[tabela].filter(function (c) { return !(c in linhas[0]); });
        if (faltam.length) avisar("c:" + tabela, "Na tabela <b>" + tabela + "</b> faltam os campos: " + faltam.join(", ") + ". Rode o banco.sql de novo. O painel segue funcionando com o que tem.");
      }
      return linhas;
    } catch (e) {
      estado.ok[tabela] = false;
      avisar("t:" + tabela, explicarErro(tabela, e));
      return [];
    }
  }

  var inicio14 = new Date(); inicio14.setHours(0, 0, 0, 0); inicio14.setDate(inicio14.getDate() - 13);
  var todos = await Promise.all([
    carregar("videos", function (q) { return q.select("*").order("ordem", { ascending: true }).order("id", { ascending: true }); }, function (q) { return q.select("*"); }),
    carregar("marcas", function (q) { return q.select("*").order("criado_em", { ascending: false }); }, function (q) { return q.select("*"); }),
    carregar("calendario", function (q) { return q.select("*").order("data", { ascending: true }); }, function (q) { return q.select("*"); }),
    carregar("campanhas", function (q) { return q.select("*").order("criado_em", { ascending: false }); }, function (q) { return q.select("*"); }),
    carregar("marcados", function (q) { return q.select("chave"); }),
    carregar("visitas", function (q) { return q.select("data,origem,pagina").gte("data", inicio14.toISOString()).limit(20000); },
      function (q) { return q.select("*").limit(20000); })
  ]);
  estado.videos = todos[0];
  estado.marcas = todos[1];
  estado.calendario = todos[2];
  estado.campanhas = todos[3];
  todos[4].forEach(function (l) { if (l.chave) estado.marcados[l.chave] = true; });
  estado.visitas = todos[5];

  // Grava no banco e devolve a linha salva (ou o erro)
  async function gravar(tabela, dados, id) {
    try {
      var q = id ? banco.from(tabela).update(dados).eq("id", id) : banco.from(tabela).insert(dados);
      var r2 = await q.select().single();
      if (r2.error) throw r2.error;
      return { linha: r2.data };
    } catch (e) { return { erro: e }; }
  }
  async function apagar(tabela, id) {
    try {
      var r3 = await banco.from(tabela).delete().eq("id", id);
      if (r3.error) throw r3.error;
      return {};
    } catch (e) { return { erro: e }; }
  }
  function trocarNaLista(lista, linha) {
    var i = lista.findIndex(function (x) { return x.id === linha.id; });
    if (i > -1) lista[i] = linha; else lista.push(linha);
  }

  /* ================= 5. JANELA (formulários e fichas) ================= */
  var janela = $("#janela");
  janela.addEventListener("click", function (e) {
    if (e.target.closest("[data-fechar]")) { janela.close(); return; }
    if (e.target === janela) {
      var b = janela.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) janela.close();
    }
  });
  function abrirJanela(titulo, html, larga) {
    $("#janela-titulo").textContent = titulo;
    $("#janela-conteudo").innerHTML = html;
    janela.classList.toggle("larga", !!larga);
    if (!janela.open) janela.showModal();
    return $("#janela-conteudo");
  }

  // Formulário genérico: campos = [{ nome, rotulo, tipo, opcoes, obrigatorio, inteiro, dica, lista }]
  function abrirFormulario(cfg) {
    var v = cfg.valores || {};
    var campos = cfg.campos.map(function (c) {
      var id = "f-" + c.nome, valor = v[c.nome] == null ? "" : v[c.nome], html;
      var classe = c.inteiro || c.tipo === "textarea" || c.tipo === "check" ? ' class="inteiro"' : "";
      if (c.tipo === "check") {
        return "<div" + classe + '><label class="marcar"><input type="checkbox" id="' + id + '" name="' + c.nome + '"' + (valor ? " checked" : "") + "> " + esc(c.rotulo) + "</label>" + (c.dica ? '<div class="dica">' + esc(c.dica) + "</div>" : "") + "</div>";
      }
      if (c.tipo === "select") {
        html = '<select class="campo" id="' + id + '" name="' + c.nome + '">' + c.opcoes.map(function (o) {
          var val = Array.isArray(o) ? o[0] : o, txt = Array.isArray(o) ? o[1] : o;
          return '<option value="' + esc(val) + '"' + (String(val) === String(valor) ? " selected" : "") + ">" + esc(txt) + "</option>";
        }).join("") + "</select>";
      } else if (c.tipo === "textarea") {
        html = '<textarea class="campo" id="' + id + '" name="' + c.nome + '" rows="4">' + esc(valor) + "</textarea>";
      } else {
        html = '<input class="campo" id="' + id + '" name="' + c.nome + '" type="' + (c.tipo || "text") + '" value="' + esc(valor) + '"' +
          (c.obrigatorio ? " required" : "") + (c.tipo === "number" ? ' step="' + (c.passo || "1") + '" min="0"' : "") +
          (c.lista ? ' list="' + id + '-lista"' : "") + (c.dicaCampo ? ' placeholder="' + esc(c.dicaCampo) + '"' : "") + ">";
        if (c.lista) html += '<datalist id="' + id + '-lista">' + c.lista.map(function (o) { return '<option value="' + esc(o) + '">'; }).join("") + "</datalist>";
      }
      return "<div" + classe + '><label for="' + id + '">' + esc(c.rotulo) + (c.obrigatorio ? " *" : "") + "</label>" + html + (c.dica ? '<div class="dica">' + esc(c.dica) + "</div>" : "") + "</div>";
    }).join("");
    var corpo = '<form id="form-janela" novalidate><div class="janela-corpo"><div class="erro-form" id="erro-janela" hidden></div><div class="form-grade">' + campos + "</div></div>" +
      '<div class="janela-rodape">' + (cfg.aoApagar ? '<button type="button" class="btn perigo esquerda" id="apagar-janela">' + ic("lixo", "width:15px;height:15px") + " Apagar</button>" : "") +
      '<button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" class="btn principal">Salvar</button></div></form>';
    var raiz = abrirJanela(cfg.titulo, corpo);
    var form = $("#form-janela", raiz);
    var primeiro = form.querySelector("input:not([type=checkbox]), select, textarea");
    if (primeiro) setTimeout(function () { primeiro.focus(); }, 30);
    function mostrarErro(msg) { var e = $("#erro-janela", raiz); e.textContent = msg; e.hidden = !msg; }
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var dados = {};
      for (var i = 0; i < cfg.campos.length; i++) {
        var c = cfg.campos[i], el = form.elements[c.nome];
        if (c.tipo === "check") dados[c.nome] = el.checked;
        else if (c.tipo === "number") dados[c.nome] = el.value === "" ? 0 : num(el.value);
        else {
          var val = el.value.trim();
          if (c.obrigatorio && !val) { mostrarErro("Preencha o campo \"" + c.rotulo + "\"."); el.focus(); return; }
          dados[c.nome] = val === "" ? (c.vazio !== undefined ? c.vazio : null) : val;
        }
      }
      var botao = form.querySelector("[type=submit]");
      botao.disabled = true; botao.textContent = "Salvando...";
      var erro = await cfg.aoSalvar(dados);
      if (erro) { mostrarErro(erro); botao.disabled = false; botao.textContent = "Salvar"; return; }
      janela.close();
    });
    if (cfg.aoApagar) $("#apagar-janela", raiz).addEventListener("click", async function () {
      if (!confirm(cfg.perguntaApagar || "Apagar este item? Não dá pra desfazer.")) return;
      var erro = await cfg.aoApagar();
      if (erro) { mostrarErro(erro); return; }
      janela.close();
    });
  }

  /* ================= 6. NAVEGAÇÃO ENTRE ABAS ================= */
  var ABAS = {
    portfolio: { titulo: "Portfólio", montar: montarPortfolio },
    marcas: { titulo: "Marcas", montar: montarMarcas },
    calendario: { titulo: "Calendário", montar: montarCalendario },
    campanhas: { titulo: "Campanhas", montar: montarCampanhas },
    checklist: { titulo: "Checklist portfólio", montar: montarChecklist }
  };
  var abaAtual = "portfolio";
  function corpoDa(aba) { return $("#aba-" + aba); }
  // Cada aba é montada dentro de uma proteção: se der erro, só ela mostra o aviso
  function montarSeguro(aba) {
    var corpo = corpoDa(aba);
    try { ABAS[aba].montar(corpo); }
    catch (e) {
      console.error(e);
      corpo.innerHTML = '<div class="bloco"><div class="vazio">Algo deu errado ao montar esta aba (' + esc(e.message) + "). As outras abas continuam funcionando.</div></div>";
    }
  }
  function irPara(aba) {
    if (!ABAS[aba]) aba = "portfolio";
    abaAtual = aba;
    Object.keys(ABAS).forEach(function (a) { corpoDa(a).hidden = a !== aba; });
    $$(".menu a.item").forEach(function (a) {
      var ativo = a.dataset.aba === aba;
      a.classList.toggle("ativo", ativo);
      if (ativo) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $("#titulo-aba").textContent = ABAS[aba].titulo;
    document.title = ABAS[aba].titulo + " | Painel";
    fecharGaveta();
    montarSeguro(aba);
  }
  window.addEventListener("hashchange", function () { irPara(location.hash.slice(1)); });

  // Gaveta do celular
  function fecharGaveta() {
    $("#menu").classList.remove("aberta");
    $("#fundo-gaveta").classList.remove("visivel");
    $("#abrir-gaveta").setAttribute("aria-expanded", "false");
  }
  $("#abrir-gaveta").addEventListener("click", function () {
    $("#menu").classList.add("aberta");
    $("#fundo-gaveta").classList.add("visivel");
    $("#abrir-gaveta").setAttribute("aria-expanded", "true");
  });
  $("#fundo-gaveta").addEventListener("click", fecharGaveta);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharGaveta(); });

  // E-mail e botão Sair
  var meuEmail = (sessao.user && sessao.user.email) || "";
  $("#meu-email").textContent = meuEmail;
  if (meuEmail && meuEmail.toLowerCase() !== EMAIL_ADMIN.toLowerCase())
    avisar("conta", "Você entrou com <b>" + esc(meuEmail) + "</b>. Os dados do painel só abrem para a conta " + esc(EMAIL_ADMIN) + ".");
  $("#sair").addEventListener("click", async function () {
    try { await banco.auth.signOut(); } catch (e) {}
    location.replace("../login/");
  });

  // Capas vertical do YouTube: se não existir, usa a capa padrão
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.dataset.reserva) { img.src = img.dataset.reserva; delete img.dataset.reserva; }
  }, true);
  function capaYT(id, vertical) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/" + (vertical ? "oardefault" : "hqdefault") + ".jpg"; }

  /* ================= 7. ABA PORTFÓLIO ================= */
  function montarPortfolio(corpo) {
    // Últimos 14 dias
    var dias = [];
    for (var i = 13; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); dias.push(iso(d)); }
    var porDia = {}; dias.forEach(function (d) { porDia[d] = 0; });
    var porOrigem = {};
    estado.visitas.forEach(function (v) {
      if (!v || !v.data) return;
      var dia = iso(new Date(v.data));
      if (!(dia in porDia)) return;
      porDia[dia]++;
      var o = (v.origem || "direto").trim() || "direto";
      porOrigem[o] = (porOrigem[o] || 0) + 1;
    });
    var total14 = dias.reduce(function (s, d) { return s + porDia[d]; }, 0);
    var hoje = porDia[hojeISO()] || 0;
    var noAr = estado.videos.filter(function (v) { return v.visivel !== false; });
    var porNicho = {};
    noAr.forEach(function (v) { var n = v.nicho || "Sem nicho"; porNicho[n] = (porNicho[n] || 0) + 1; });
    var nichoTop = Object.keys(porNicho).sort(function (a, b) { return porNicho[b] - porNicho[a]; })[0];
    var origens = Object.keys(porOrigem).sort(function (a, b) { return porOrigem[b] - porOrigem[a]; });

    var faixa = '<div class="faixa">' +
      "<div><small>Visitas em 14 dias</small><strong>" + total14 + "</strong></div>" +
      "<div><small>Visitas hoje</small><strong>" + hoje + "</strong></div>" +
      "<div><small>Vídeos no ar</small><strong>" + noAr.length + "</strong><span>de " + plural(estado.videos.length, "cadastrado", "cadastrados") + "</span></div>" +
      "<div><small>Nicho mais forte</small><strong>" + (nichoTop ? esc(nichoTop) : "Nenhum ainda") + "</strong><span>" + (nichoTop ? plural(porNicho[nichoTop], "vídeo no ar", "vídeos no ar") : "cadastre vídeos") + "</span></div>" +
      "<div><small>De onde mais vêm</small><strong>" + (origens[0] ? esc(origens[0]) : "Ainda sem visitas") + "</strong><span>" + (origens[0] ? plural(porOrigem[origens[0]], "visita", "visitas") : "aparece quando chegar a primeira") + "</span></div>" +
      "</div>";

    var grafico;
    if (!total14) {
      grafico = '<div class="vazio">Quando as pessoas começarem a visitar o seu portfólio, aqui aparece uma barrinha por dia mostrando quantas visitas ele teve em cada um dos últimos 14 dias.</div>';
    } else {
      var maior = Math.max.apply(null, dias.map(function (d) { return porDia[d]; })) || 1;
      grafico = '<div class="grafico" role="img" aria-label="Visitas por dia nos últimos 14 dias">' + dias.map(function (d) {
        var n = porDia[d], h = Math.round((n / maior) * 100);
        return '<div class="coluna"><div class="barra-g' + (d === hojeISO() ? " hoje" : "") + '" style="height:' + Math.max(h, 1) + '%">' + (n ? "<b>" + n + "</b>" : "") + '</div><span class="dia">' + d.slice(8, 10) + "/" + d.slice(5, 7) + "</span></div>";
      }).join("") + "</div>";
    }
    var listaOrigens = !total14
      ? '<div class="vazio">Aqui vai aparecer por onde as pessoas chegam no seu site: Instagram, Google, WhatsApp ou link direto.</div>'
      : '<ul class="origens">' + origens.slice(0, 8).map(function (o) {
          var pct = Math.round((porOrigem[o] / total14) * 100);
          return '<li><div class="linha-o"><span>' + esc(o) + "</span><span class=\"suave\">" + porOrigem[o] + " · " + pct + '%</span></div><div class="trilho"><i style="width:' + pct + '%"></i></div></li>';
        }).join("") + "</ul>";

    corpo.innerHTML = faixa +
      '<div class="duas-colunas">' +
        '<div class="bloco"><div class="bloco-topo"><h3>Visitas nos últimos 14 dias</h3></div><div class="bloco-corpo">' + grafico + "</div></div>" +
        '<div class="bloco"><div class="bloco-topo"><h3>Por onde chegaram</h3></div><div class="bloco-corpo">' + listaOrigens + "</div></div>" +
      "</div>" +
      '<div class="bloco"><div class="bloco-topo"><h3>Meus vídeos</h3><span class="suave" style="font-size:12px">Arraste pela alcinha para mudar a ordem no site</span>' +
        '<button class="btn principal" type="button" id="novo-video">' + ic("mais", "width:15px;height:15px") + " Adicionar vídeo</button></div>" +
        '<div class="tabela-rolagem" id="tabela-videos"></div></div>';

    montarTabelaVideos();
    $("#novo-video").addEventListener("click", function () { formularioVideo(null); });
  }

  function montarTabelaVideos() {
    var alvo = $("#tabela-videos");
    if (!alvo) return;
    if (estado.ok.videos === false) { alvo.innerHTML = '<div class="vazio">A tabela de vídeos ainda não existe no banco. Rode o banco.sql e recarregue. Enquanto isso, o site mostra a lista fixa de vídeos.</div>'; return; }
    if (!estado.videos.length) { alvo.innerHTML = '<div class="vazio">Nenhum vídeo cadastrado ainda. Clique em "Adicionar vídeo".</div>'; return; }
    alvo.innerHTML = '<table class="planilha"><thead><tr><th style="width:34px"><span class="sr">Ordem</span></th><th style="width:48px">Capa</th><th>Vídeo</th><th>Nicho</th><th>Formato</th><th>Destaque</th><th style="width:110px"><span class="sr">Ações</span></th></tr></thead><tbody>' +
      estado.videos.map(function (v) {
        var id = idYouTube(v.link);
        var capa = id ? '<img class="miniatura" src="' + capaYT(id, true) + '" data-reserva="' + capaYT(id) + '" alt="" loading="lazy">' : '<span class="miniatura"></span>';
        var vis = v.visivel !== false;
        return '<tr data-id="' + v.id + '" class="' + (vis ? "" : "escondido") + '">' +
          '<td><button class="btn-icone alca" type="button" aria-label="Arrastar para mudar a ordem (ou use as setas do teclado)">' + ic("grip") + "</button></td>" +
          "<td>" + capa + "</td>" +
          "<td><b>" + esc(v.marca || "Sem marca") + '</b><br><span class="suave">' + esc(v.titulo || "") + "</span></td>" +
          "<td>" + esc(v.nicho || "") + "</td><td>" + esc(v.formato || "") + "</td>" +
          "<td>" + (v.destaque ? '<span class="pilula">' + esc(v.destaque) + "</span>" : "") + "</td>" +
          '<td><div class="acoes-linha">' +
            '<button class="btn-icone ' + (vis ? "on" : "") + '" type="button" data-acao="olho" aria-pressed="' + vis + '" aria-label="' + (vis ? "Esconder do site" : "Mostrar no site") + '" title="' + (vis ? "Aparece no site. Clique para esconder" : "Escondido do site. Clique para mostrar") + '">' + ic(vis ? "olho" : "olhoFechado") + "</button>" +
            '<button class="btn-icone" type="button" data-acao="editar" aria-label="Editar">' + ic("lapis") + "</button>" +
            '<button class="btn-icone" type="button" data-acao="apagar" aria-label="Apagar">' + ic("lixo") + "</button>" +
          "</div></td></tr>";
      }).join("") + "</tbody></table>";

    var tbody = alvo.querySelector("tbody");
    tbody.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-acao]");
      if (!b) return;
      var id = Number(b.closest("tr").dataset.id);
      var v = estado.videos.find(function (x) { return x.id === id; });
      if (!v) return;
      if (b.dataset.acao === "editar") formularioVideo(v);
      if (b.dataset.acao === "apagar") {
        if (!confirm("Apagar o vídeo de " + (v.marca || "sem marca") + "? Ele sai do site e não dá pra desfazer.")) return;
        var r4 = await apagar("videos", id);
        if (r4.erro) { toast(mensagemCurta(r4.erro), true); return; }
        estado.videos = estado.videos.filter(function (x) { return x.id !== id; });
        toast("Vídeo apagado");
        montarSeguro("portfolio");
      }
      if (b.dataset.acao === "olho") {
        var novo = v.visivel === false;
        var r5 = await gravar("videos", { visivel: novo }, id);
        if (r5.erro) { toast(mensagemCurta(r5.erro), true); return; }
        trocarNaLista(estado.videos, r5.linha);
        toast(novo ? "Voltou a aparecer no site" : "Escondido do site");
        montarSeguro("portfolio");
      }
    });

    // Arrastar pela alcinha (mouse e dedo)
    tbody.addEventListener("pointerdown", function (e) {
      var alca = e.target.closest(".alca");
      if (!alca || e.button > 0) return;
      e.preventDefault();
      var tr = alca.closest("tr");
      tr.classList.add("arrastando");
      try { alca.setPointerCapture(e.pointerId); } catch (x) {}
      function mover(ev) {
        if (ev.clientY < 70) window.scrollBy(0, -14);
        else if (ev.clientY > window.innerHeight - 50) window.scrollBy(0, 14);
        var depois = null, linhas = Array.prototype.slice.call(tbody.children);
        for (var i = 0; i < linhas.length; i++) {
          if (linhas[i] === tr) continue;
          var caixa = linhas[i].getBoundingClientRect();
          if (ev.clientY < caixa.top + caixa.height / 2) { depois = linhas[i]; break; }
        }
        if (depois !== tr.nextSibling) tbody.insertBefore(tr, depois);
      }
      function soltar() {
        alca.removeEventListener("pointermove", mover);
        alca.removeEventListener("pointerup", soltar);
        alca.removeEventListener("pointercancel", soltar);
        tr.classList.remove("arrastando");
        salvarOrdem(tbody);
      }
      alca.addEventListener("pointermove", mover);
      alca.addEventListener("pointerup", soltar);
      alca.addEventListener("pointercancel", soltar);
    });
    // Teclado: setas para cima e para baixo na alcinha
    tbody.addEventListener("keydown", function (e) {
      var alca = e.target.closest(".alca");
      if (!alca || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      var tr = alca.closest("tr");
      if (e.key === "ArrowUp" && tr.previousElementSibling) tbody.insertBefore(tr, tr.previousElementSibling);
      if (e.key === "ArrowDown" && tr.nextElementSibling) tbody.insertBefore(tr.nextElementSibling, tr);
      alca.focus();
      salvarOrdem(tbody);
    });
  }

  var ordemTimer;
  function salvarOrdem(tbody) {
    var ids = Array.prototype.map.call(tbody.children, function (tr) { return Number(tr.dataset.id); });
    var mapa = {}; estado.videos.forEach(function (v) { mapa[v.id] = v; });
    var mudou = [];
    ids.forEach(function (id, i) { var v = mapa[id]; if (v && v.ordem !== i + 1) { v.ordem = i + 1; mudou.push(v); } });
    estado.videos = ids.map(function (id) { return mapa[id]; }).filter(Boolean);
    if (!mudou.length) return;
    clearTimeout(ordemTimer);
    ordemTimer = setTimeout(async function () {
      var resultados = await Promise.all(mudou.map(function (v) {
        return banco.from("videos").update({ ordem: v.ordem }).eq("id", v.id);
      }));
      var falhou = resultados.find(function (r6) { return r6.error; });
      if (falhou) toast(mensagemCurta(falhou.error), true);
      else toast("Ordem salva. O site já mostra assim.");
    }, 350);
  }

  function formularioVideo(v) {
    var nichos = uniq(estado.videos.map(function (x) { return x.nicho; }));
    var formatos = uniq(["Shorts", "Reels", "TikTok", "Foto"].concat(estado.videos.map(function (x) { return x.formato; })));
    abrirFormulario({
      titulo: v ? "Editar vídeo" : "Adicionar vídeo",
      valores: v || { formato: "Shorts", visivel: true },
      campos: [
        { nome: "marca", rotulo: "Marca", vazio: "" },
        { nome: "titulo", rotulo: "Título ou subcategoria", dicaCampo: "Ex: Skincare", vazio: "" },
        { nome: "link", rotulo: "Link do vídeo", tipo: "url", obrigatorio: true, inteiro: true, dicaCampo: "https://youtube.com/shorts/...", dica: "Com link do YouTube, a capa aparece sozinha e o vídeo toca dentro do site." },
        { nome: "nicho", rotulo: "Nicho", lista: nichos, vazio: "", dica: "É o botão de filtro no site." },
        { nome: "formato", rotulo: "Formato", lista: formatos, vazio: "" },
        { nome: "destaque", rotulo: "Número de destaque", inteiro: true, dicaCampo: "Ex: +470 mil visualizações", dica: "Preenchido, o vídeo entra na seção de destaques do site (aparecem os 3 primeiros da lista)." },
        { nome: "visivel", rotulo: "Aparece no site", tipo: "check" }
      ],
      aoSalvar: async function (dados) {
        if (!v) dados.ordem = estado.videos.reduce(function (m, x) { return Math.max(m, num(x.ordem)); }, 0) + 1;
        var r7 = await gravar("videos", dados, v && v.id);
        if (r7.erro) return mensagemCurta(r7.erro);
        trocarNaLista(estado.videos, r7.linha);
        toast(v ? "Vídeo atualizado. O site já mostra a mudança." : "Vídeo adicionado. Já está no site.");
        montarSeguro("portfolio");
      },
      aoApagar: v ? async function () {
        var r8 = await apagar("videos", v.id);
        if (r8.erro) return mensagemCurta(r8.erro);
        estado.videos = estado.videos.filter(function (x) { return x.id !== v.id; });
        toast("Vídeo apagado");
        montarSeguro("portfolio");
      } : null
    });
  }
  function uniq(lista) {
    var visto = {}, fora = [];
    lista.forEach(function (x) { x = (x || "").trim(); if (x && !visto[x.toLowerCase()]) { visto[x.toLowerCase()] = true; fora.push(x); } });
    return fora;
  }

  /* ================= 8. ABA MARCAS ================= */
  var SITUACOES = [["lead", "Lead"], ["conversando", "Conversando"], ["cliente", "Cliente"], ["parada", "Parada"]];
  var nomeSituacao = {}; SITUACOES.forEach(function (s) { nomeSituacao[s[0]] = s[1]; });
  var filtroMarcas = { busca: "", situacao: "" };

  function linkInstagram(valor) {
    var h = String(valor || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "").replace(/\?.*$/, "");
    return h ? { usuario: "@" + h, link: "https://instagram.com/" + encodeURIComponent(h) } : null;
  }
  function linkWhats(tel) {
    var d = String(tel || "").replace(/\D/g, "");
    if (d.length < 10) return null;
    if (d.length <= 11) d = "55" + d;
    return "https://wa.me/" + d;
  }
  function marcasFiltradas() {
    var b = semAcento(filtroMarcas.busca.trim());
    return estado.marcas.filter(function (m) {
      if (filtroMarcas.situacao && m.situacao !== filtroMarcas.situacao) return false;
      if (!b) return true;
      return semAcento([m.nome, m.instagram, m.email].join(" ")).indexOf(b.replace(/^@/, "")) > -1;
    });
  }

  function montarMarcas(corpo) {
    var contagem = {}; estado.marcas.forEach(function (m) { contagem[m.situacao] = (contagem[m.situacao] || 0) + 1; });
    corpo.innerHTML = '<div class="bloco"><div class="bloco-topo">' +
      '<input class="campo busca" type="search" id="busca-marcas" placeholder="Buscar por nome, @ ou e-mail" aria-label="Buscar marcas" value="' + esc(filtroMarcas.busca) + '">' +
      '<select class="campo" id="filtro-situacao" aria-label="Filtrar por situação"><option value="">Todas as situações (' + estado.marcas.length + ")</option>" +
        SITUACOES.map(function (s) { return '<option value="' + s[0] + '"' + (filtroMarcas.situacao === s[0] ? " selected" : "") + ">" + s[1] + " (" + (contagem[s[0]] || 0) + ")</option>"; }).join("") + "</select>" +
      '<span style="margin-left:auto"></span>' +
      '<button class="btn" type="button" id="baixar-marcas">' + ic("baixar", "width:15px;height:15px") + " Baixar CSV</button>" +
      '<button class="btn principal" type="button" id="nova-marca">' + ic("mais", "width:15px;height:15px") + " Adicionar marca</button>" +
      '</div><div class="tabela-rolagem" id="tabela-marcas"></div></div>';
    montarTabelaMarcas();
    $("#busca-marcas").addEventListener("input", function (e) { filtroMarcas.busca = e.target.value; montarTabelaMarcas(); });
    $("#filtro-situacao").addEventListener("change", function (e) { filtroMarcas.situacao = e.target.value; montarTabelaMarcas(); });
    $("#nova-marca").addEventListener("click", function () { formularioMarca(null); });
    $("#baixar-marcas").addEventListener("click", function () {
      var linhas = marcasFiltradas().map(function (m) {
        return [m.nome, m.instagram, m.email, m.telefone, nomeSituacao[m.situacao] || m.situacao, m.obs, dataBR(m.ultimo_contato), m.origem === "site" ? "Site" : "Admin"];
      });
      baixarCSV("marcas", ["Marca", "Instagram", "E-mail", "Telefone", "Situação", "Observação", "Último contato", "Origem"], linhas);
    });
  }

  function montarTabelaMarcas() {
    var alvo = $("#tabela-marcas");
    if (!alvo) return;
    if (estado.ok.marcas === false) { alvo.innerHTML = '<div class="vazio">A tabela de marcas ainda não existe no banco. Rode o banco.sql e recarregue.</div>'; return; }
    var lista = marcasFiltradas();
    if (!lista.length) { alvo.innerHTML = '<div class="vazio">' + (estado.marcas.length ? "Nenhuma marca encontrada com essa busca." : "Nenhuma marca ainda. Quem mandar o formulário do site aparece aqui como Lead.") + "</div>"; return; }
    alvo.innerHTML = '<table class="planilha"><thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th></tr></thead><tbody>' +
      lista.map(function (m) {
        var insta = linkInstagram(m.instagram), whats = linkWhats(m.telefone);
        return '<tr class="clicavel" data-id="' + m.id + '" tabindex="0">' +
          "<td><b>" + esc(m.nome) + "</b>" + (m.exemplo ? '<span class="etiqueta exemplo">exemplo</span>' : "") + (m.origem === "site" ? '<span class="etiqueta site">site</span>' : "") + "</td>" +
          "<td>" + (insta ? '<a href="' + insta.link + '" target="_blank" rel="noopener">' + esc(insta.usuario) + "</a>" : "") + "</td>" +
          '<td class="corte">' + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a>" : "") + "</td>" +
          '<td style="white-space:nowrap">' + esc(m.telefone || "") + (whats ? ' <a class="btn-icone" href="' + whats + '" target="_blank" rel="noopener" aria-label="Abrir WhatsApp de ' + esc(m.nome) + '" title="Abrir no WhatsApp">' + ic("zap", "width:16px;height:16px") + "</a>" : "") + "</td>" +
          '<td><span class="pilula sit-' + esc(m.situacao) + '">' + esc(nomeSituacao[m.situacao] || m.situacao || "") + "</span></td>" +
          '<td class="corte" title="' + esc(m.obs || "") + '">' + esc(m.obs || "") + "</td>" +
          '<td style="white-space:nowrap">' + dataBR(m.ultimo_contato) + "</td></tr>";
      }).join("") + "</tbody></table>";
    var tbody = alvo.querySelector("tbody");
    function abrirLinha(e) {
      if (e.target.closest("a, button")) return;
      var tr = e.target.closest("tr");
      if (!tr) return;
      var m = estado.marcas.find(function (x) { return x.id === Number(tr.dataset.id); });
      if (m) formularioMarca(m);
    }
    tbody.addEventListener("click", abrirLinha);
    tbody.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.matches("tr")) abrirLinha(e); });
  }

  function formularioMarca(m) {
    abrirFormulario({
      titulo: m ? "Editar marca" : "Adicionar marca",
      valores: m || { situacao: "lead", ultimo_contato: hojeISO() },
      campos: [
        { nome: "nome", rotulo: "Marca", obrigatorio: true, inteiro: true },
        { nome: "instagram", rotulo: "Instagram", dicaCampo: "@marca" },
        { nome: "email", rotulo: "E-mail", tipo: "email" },
        { nome: "telefone", rotulo: "Telefone", tipo: "tel", dicaCampo: "(11) 90000-0000" },
        { nome: "situacao", rotulo: "Situação", tipo: "select", opcoes: SITUACOES },
        { nome: "ultimo_contato", rotulo: "Último contato", tipo: "date" },
        { nome: "obs", rotulo: "Observação", tipo: "textarea" }
      ],
      aoSalvar: async function (dados) {
        var r9 = await gravar("marcas", dados, m && m.id);
        if (r9.erro) return mensagemCurta(r9.erro);
        if (m) trocarNaLista(estado.marcas, r9.linha); else estado.marcas.unshift(r9.linha);
        toast(m ? "Marca atualizada" : "Marca adicionada");
        montarSeguro("marcas");
      },
      aoApagar: m ? async function () {
        var r10 = await apagar("marcas", m.id);
        if (r10.erro) return mensagemCurta(r10.erro);
        estado.marcas = estado.marcas.filter(function (x) { return x.id !== m.id; });
        toast("Marca apagada");
        montarSeguro("marcas");
      } : null
    });
  }

  // CSV que abre certinho no Excel em português (acentos e separador ;)
  function baixarCSV(nome, cabecalho, linhas) {
    function celula(v) {
      var s = v == null ? "" : String(v);
      return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var texto = "﻿" + [cabecalho].concat(linhas).map(function (l) { return l.map(celula).join(";"); }).join("\r\n");
    var blob = new Blob([texto], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome + "-" + hojeISO() + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("Arquivo baixado (" + plural(linhas.length, "linha", "linhas") + ")");
  }

  /* ================= 9. ABA CALENDÁRIO ================= */
  var TIPOS_CAL = [["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"]];
  var calMes = new Date(); calMes.setDate(1);
  var calFiltro = "todos";

  function eventosDoCalendario() {
    var lista = [];
    if (calFiltro === "todos" || calFiltro !== "prazos") {
      estado.calendario.forEach(function (c) {
        if (!c.data) return;
        if (calFiltro !== "todos" && c.tipo !== calFiltro) return;
        lista.push({ fonte: "cal", item: c, data: String(c.data).slice(0, 10), titulo: c.titulo, classe: (c.tipo || "gravar") + (c.status === "feito" ? " feito" : ""), feito: c.status === "feito" });
      });
    }
    if (calFiltro === "todos" || calFiltro === "prazos") {
      estado.campanhas.forEach(function (c) {
        if (!c.prazo) return;
        lista.push({ fonte: "camp", item: c, data: String(c.prazo).slice(0, 10), titulo: "Prazo: " + (c.campanha || ""), classe: "prazo" + (c.status === "Entregue" ? " feito" : ""), feito: c.status === "Entregue" });
      });
    }
    return lista;
  }

  function montarCalendario(corpo) {
    var nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calMes);
    nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    var filtros = [["todos", "Todos"]].concat(TIPOS_CAL).concat([["prazos", "Prazos de campanha"]]);
    var eventos = eventosDoCalendario(), porDia = {};
    eventos.forEach(function (ev) { (porDia[ev.data] = porDia[ev.data] || []).push(ev); });

    var primeiro = new Date(calMes.getFullYear(), calMes.getMonth(), 1);
    var recuo = (primeiro.getDay() + 6) % 7; // segunda-feira primeiro
    var diasNoMes = new Date(calMes.getFullYear(), calMes.getMonth() + 1, 0).getDate();
    var semanas = Math.ceil((recuo + diasNoMes) / 7);
    var inicioGrade = new Date(primeiro); inicioGrade.setDate(1 - recuo);
    var hoje = hojeISO();
    var celulas = "";
    for (var i = 0; i < semanas * 7; i++) {
      var d = new Date(inicioGrade); d.setDate(inicioGrade.getDate() + i);
      var chave = iso(d), doDia = porDia[chave] || [];
      var fora = d.getMonth() !== calMes.getMonth();
      celulas += '<div class="cal-dia' + (fora ? " fora" : "") + (chave === hoje ? " hoje" : "") + '" data-data="' + chave + '">' +
        '<span class="n">' + d.getDate() + "</span>" +
        '<button class="mais-add" type="button" data-add="' + chave + '" aria-label="Adicionar em ' + dataBR(chave) + '">' + ic("mais", "width:14px;height:14px") + "</button>" +
        doDia.slice(0, 3).map(function (ev, k) {
          return '<button class="ev ' + ev.classe + '" type="button" data-ev="' + chave + "|" + k + '" title="' + esc(ev.titulo + (ev.item.marca ? " · " + ev.item.marca : "")) + '">' + esc(ev.titulo) + "</button>";
        }).join("") +
        (doDia.length > 3 ? '<button class="ev-mais" type="button" data-dia="' + chave + '">+' + (doDia.length - 3) + " mais</button>" : "") +
        "</div>";
    }

    // Ficou pra trás
    var atrasados = [];
    estado.calendario.forEach(function (c) {
      if (c.data && c.status !== "feito" && diasAte(c.data) < 0) atrasados.push({ fonte: "cal", item: c, dias: -diasAte(c.data), texto: c.titulo, sub: (nomeTipo(c.tipo) + (c.marca ? " · " + c.marca : "")) });
    });
    estado.campanhas.forEach(function (c) {
      if (c.prazo && c.status !== "Entregue" && c.ativa !== false && diasAte(c.prazo) < 0) atrasados.push({ fonte: "camp", item: c, dias: -diasAte(c.prazo), texto: "Prazo da campanha " + (c.campanha || ""), sub: (c.cliente || "") + (c.status ? " · " + c.status : "") });
    });
    atrasados.sort(function (a, b) { return b.dias - a.dias; });

    corpo.innerHTML = '<div class="cal-topo">' +
        '<button class="btn-icone" type="button" id="mes-antes" aria-label="Mês anterior">' + ic("esquerda") + "</button>" +
        '<span class="mes" aria-live="polite">' + esc(nomeMes) + "</span>" +
        '<button class="btn-icone" type="button" id="mes-depois" aria-label="Próximo mês">' + ic("direita") + "</button>" +
        '<button class="btn pequeno" type="button" id="este-mes">Este mês</button>' +
        '<div class="chips" role="group" aria-label="Filtrar por tipo">' + filtros.map(function (f) {
          return '<button class="chip" type="button" data-filtro="' + f[0] + '" aria-pressed="' + (calFiltro === f[0]) + '">' + f[1] + "</button>";
        }).join("") + "</div>" +
      "</div>" +
      '<div class="cal">' + ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(function (n) { return '<div class="cal-cab">' + n + "</div>"; }).join("") + celulas + "</div>" +
      '<div class="legenda-cal"><span><i style="background:#f3e1dc"></i>Gravar</span><span><i style="background:#efe3c6"></i>Editar</span><span><i style="background:#e1e5d3"></i>Postar</span><span><i style="border:1px dashed #C99B91"></i>Prazo de campanha</span><span>Clique num dia para adicionar</span></div>' +
      '<div class="bloco" style="margin-top:18px"><div class="bloco-topo"><h3>Ficou pra trás</h3><span class="suave" style="font-size:12px">' + plural(atrasados.length, "item", "itens") + "</span></div>" +
        (atrasados.length ? '<ul class="atras">' + atrasados.map(function (a, k) {
          return "<li><span><b>" + esc(a.texto) + '</b><br><span class="suave" style="font-size:12px">' + esc(a.sub) + "</span></span>" +
            '<span class="ha">há ' + plural(a.dias, "dia", "dias") + "</span>" +
            (a.fonte === "cal" ? '<button class="btn pequeno" type="button" data-feito="' + a.item.id + '">' + ic("check", "width:14px;height:14px") + " Feito</button>" : '<button class="btn pequeno" type="button" data-camp="' + a.item.id + '">Abrir</button>') + "</li>";
        }).join("") + "</ul>" : '<div class="vazio">Nada atrasado. Tudo em dia!</div>') +
      "</div>";

    $("#mes-antes").addEventListener("click", function () { calMes.setMonth(calMes.getMonth() - 1); montarSeguro("calendario"); });
    $("#mes-depois").addEventListener("click", function () { calMes.setMonth(calMes.getMonth() + 1); montarSeguro("calendario"); });
    $("#este-mes").addEventListener("click", function () { calMes = new Date(); calMes.setDate(1); montarSeguro("calendario"); });
    $$(".cal-topo .chip", corpo).forEach(function (b) { b.addEventListener("click", function () { calFiltro = b.dataset.filtro; montarSeguro("calendario"); }); });

    $(".cal", corpo).addEventListener("click", function (e) {
      var ev = e.target.closest("[data-ev]"), mais = e.target.closest("[data-dia]"), add = e.target.closest("[data-add]"), dia = e.target.closest(".cal-dia");
      if (ev) {
        var p = ev.dataset.ev.split("|"), item = (porDia[p[0]] || [])[Number(p[1])];
        if (window.innerWidth < 560) { abrirDia(p[0]); return; }
        if (item) abrirEvento(item);
        return;
      }
      if (mais) { abrirDia(mais.dataset.dia); return; }
      if (add) { formularioCalendario(null, add.dataset.add); return; }
      if (dia) {
        if (window.innerWidth < 560) abrirDia(dia.dataset.data);
        else formularioCalendario(null, dia.dataset.data);
      }
    });
    corpo.querySelector(".bloco").addEventListener("click", async function (e) {
      var f = e.target.closest("[data-feito]"), c = e.target.closest("[data-camp]");
      if (f) {
        var r11 = await gravar("calendario", { status: "feito" }, Number(f.dataset.feito));
        if (r11.erro) { toast(mensagemCurta(r11.erro), true); return; }
        trocarNaLista(estado.calendario, r11.linha);
        toast("Marcado como feito");
        montarSeguro("calendario");
      }
      if (c) {
        var camp = estado.campanhas.find(function (x) { return x.id === Number(c.dataset.camp); });
        if (camp) formularioCampanha(camp);
      }
    });
  }
  function nomeTipo(t) { var a = TIPOS_CAL.find(function (x) { return x[0] === t; }); return a ? a[1] : (t || ""); }
  function abrirEvento(ev) {
    if (ev.fonte === "camp") formularioCampanha(ev.item);
    else formularioCalendario(ev.item);
  }
  function abrirDia(dataISO) {
    var eventos = eventosDoCalendario().filter(function (ev) { return ev.data === dataISO; });
    var html = '<div class="janela-corpo">' + (eventos.length ? '<ul class="atras" style="margin:-4px -16px">' + eventos.map(function (ev, k) {
      return '<li><span class="ev ' + ev.classe + '" style="width:auto;flex:none;margin:0">' + esc(ev.fonte === "camp" ? "Prazo" : nomeTipo(ev.item.tipo)) + "</span><span><b>" + esc(ev.fonte === "camp" ? ev.item.campanha : ev.titulo) + "</b>" +
        (ev.item.marca || ev.item.cliente ? '<br><span class="suave" style="font-size:12px">' + esc(ev.item.marca || ev.item.cliente) + "</span>" : "") + "</span>" +
        '<button class="btn pequeno" type="button" style="margin-left:auto" data-abrir="' + k + '">Abrir</button></li>';
    }).join("") + "</ul>" : '<div class="vazio">Nada neste dia ainda.</div>') + "</div>" +
      '<div class="janela-rodape"><button class="btn" type="button" data-fechar>Fechar</button><button class="btn principal" type="button" id="add-no-dia">' + ic("mais", "width:15px;height:15px") + " Adicionar neste dia</button></div>";
    var raiz = abrirJanela(dataBR(dataISO), html);
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest("[data-abrir]");
      if (b) abrirEvento(eventos[Number(b.dataset.abrir)]);
    });
    $("#add-no-dia", raiz).addEventListener("click", function () { formularioCalendario(null, dataISO); });
  }
  function formularioCalendario(c, dataISO) {
    abrirFormulario({
      titulo: c ? "Editar item do calendário" : "Adicionar no calendário",
      valores: c || { data: dataISO || hojeISO(), tipo: calFiltro === "editar" || calFiltro === "postar" ? calFiltro : "gravar", status: "a fazer" },
      campos: [
        { nome: "titulo", rotulo: "O que fazer", obrigatorio: true, inteiro: true },
        { nome: "marca", rotulo: "Marca" },
        { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: TIPOS_CAL },
        { nome: "data", rotulo: "Data", tipo: "date", obrigatorio: true },
        { nome: "status", rotulo: "Status", tipo: "select", opcoes: [["a fazer", "A fazer"], ["feito", "Feito"]] }
      ],
      aoSalvar: async function (dados) {
        var r12 = await gravar("calendario", dados, c && c.id);
        if (r12.erro) return mensagemCurta(r12.erro);
        trocarNaLista(estado.calendario, r12.linha);
        toast(c ? "Item atualizado" : "Adicionado no calendário");
        montarSeguro("calendario");
      },
      aoApagar: c ? async function () {
        var r13 = await apagar("calendario", c.id);
        if (r13.erro) return mensagemCurta(r13.erro);
        estado.calendario = estado.calendario.filter(function (x) { return x.id !== c.id; });
        toast("Item apagado");
        montarSeguro("calendario");
      } : null
    });
  }

  /* ================= 10. ABA CAMPANHAS ================= */
  var FUNIL = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];
  var campFiltro = "todas", campBusca = "", campOrdem = { col: "prazo", dir: 1 };
  var COLUNAS = [
    { col: "favorita", rotulo: "Estrela", curto: true },
    { col: "campanha", rotulo: "Campanha" },
    { col: "cliente", rotulo: "Cliente" },
    { col: "tipo", rotulo: "Tipo" },
    { col: "status", rotulo: "Status" },
    { col: "qtd", rotulo: "Qtd", num: true },
    { col: "valor", rotulo: "Valor", num: true },
    { col: "prazo", rotulo: "Prazo" },
    { col: "pagamento", rotulo: "Pagamento" }
  ];
  function valorParaOrdenar(c, col) {
    switch (col) {
      case "favorita": return c.favorita ? 0 : 1;
      case "status": var i = FUNIL.indexOf(c.status); return i < 0 ? null : i;
      case "qtd": case "valor": return c[col] == null ? null : num(c[col]);
      case "prazo": return c.prazo ? String(c.prazo).slice(0, 10) : null;
      case "pagamento": return c.pagamento === "pago" ? 1 : 0;
      default: return c[col] ? semAcento(c[col]) : null;
    }
  }
  function campanhasVisiveis() {
    var b = semAcento(campBusca.trim());
    var lista = estado.campanhas.filter(function (c) {
      if (campFiltro === "ativas" && c.ativa === false) return false;
      if (campFiltro === "finalizadas" && c.ativa !== false) return false;
      return !b || semAcento([c.campanha, c.cliente].join(" ")).indexOf(b) > -1;
    });
    var col = campOrdem.col, dir = campOrdem.dir;
    return lista.sort(function (a, z) {
      var va = valorParaOrdenar(a, col), vz = valorParaOrdenar(z, col);
      if (va === null && vz === null) return semAcento(a.campanha).localeCompare(semAcento(z.campanha), "pt-BR");
      if (va === null) return 1;          // vazios sempre no fim
      if (vz === null) return -1;
      var r = typeof va === "number" ? va - vz : String(va).localeCompare(String(vz), "pt-BR");
      return r !== 0 ? r * dir : semAcento(a.campanha).localeCompare(semAcento(z.campanha), "pt-BR");
    });
  }
  function avisoPrazo(c) {
    if (!c.prazo || c.status === "Entregue") return "";
    var d = diasAte(c.prazo);
    if (d < 0) return '<span class="prazo-alerta atrasado">atrasado ' + plural(-d, "dia", "dias") + "</span>";
    if (d === 0) return '<span class="prazo-alerta perto">vence hoje</span>';
    if (d === 1) return '<span class="prazo-alerta perto">vence amanhã</span>';
    if (d <= 3) return '<span class="prazo-alerta perto">vence em ' + d + " dias</span>";
    return "";
  }

  function montarCampanhas(corpo) {
    var reais_ = estado.campanhas.filter(function (c) { return !c.exemplo; });
    var total = reais_.length;
    var ativas = reais_.filter(function (c) { return c.ativa !== false; }).length;
    var valorTotal = reais_.reduce(function (s, c) { return s + num(c.valor); }, 0);
    var qtdTotal = reais_.reduce(function (s, c) { return s + num(c.qtd); }, 0);
    var ticket = qtdTotal > 0 ? valorTotal / qtdTotal : 0;
    var aReceber = reais_.filter(function (c) { return c.pagamento !== "pago"; }).reduce(function (s, c) { return s + num(c.valor); }, 0);
    var recebido = reais_.filter(function (c) { return c.pagamento === "pago"; }).reduce(function (s, c) { return s + num(c.valor); }, 0);

    corpo.innerHTML = '<div class="faixa">' +
        "<div><small>Campanhas</small><strong>" + total + "</strong><span>linhas de exemplo não entram nas contas</span></div>" +
        "<div><small>Ativas</small><strong>" + ativas + "</strong><span>" + plural(total - ativas, "finalizada", "finalizadas") + "</span></div>" +
        "<div><small>Valor total</small><strong>" + reais(valorTotal) + "</strong><span>ticket médio por vídeo " + reais(ticket) + "</span></div>" +
        "<div><small>A receber</small><strong>" + reais(aReceber) + "</strong><span>já recebido " + reais(recebido) + "</span></div>" +
      "</div>" +
      '<div class="bloco"><div class="bloco-topo">' +
        '<div class="chips" role="group" aria-label="Filtrar campanhas">' + [["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(function (f) {
          return '<button class="chip" type="button" data-filtro="' + f[0] + '" aria-pressed="' + (campFiltro === f[0]) + '">' + f[1] + "</button>";
        }).join("") + "</div>" +
        '<input class="campo busca" type="search" id="busca-camp" placeholder="Buscar campanha ou cliente" aria-label="Buscar campanhas" value="' + esc(campBusca) + '">' +
        '<span style="margin-left:auto"></span>' +
        '<button class="btn" type="button" id="baixar-camp">' + ic("baixar", "width:15px;height:15px") + " Baixar CSV</button>" +
        '<button class="btn principal" type="button" id="nova-camp">' + ic("mais", "width:15px;height:15px") + " Adicionar campanha</button>" +
      '</div><div class="tabela-rolagem" id="tabela-camp"></div></div>';

    montarTabelaCampanhas();
    $$(".chips .chip", corpo).forEach(function (b) { b.addEventListener("click", function () { campFiltro = b.dataset.filtro; montarSeguro("campanhas"); }); });
    $("#busca-camp").addEventListener("input", function (e) { campBusca = e.target.value; montarTabelaCampanhas(); });
    $("#nova-camp").addEventListener("click", function () { formularioCampanha(null); });
    $("#baixar-camp").addEventListener("click", function () {
      var linhas = campanhasVisiveis().map(function (c) {
        return [c.favorita ? "Sim" : "", c.campanha, c.cliente, c.tipo, c.status, num(c.qtd), num(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), dataBR(c.prazo), c.pagamento === "pago" ? "Pago" : "Pendente", c.ativa === false ? "Finalizada" : "Ativa"];
      });
      baixarCSV("campanhas", ["Favorita", "Campanha", "Cliente", "Tipo", "Status", "Qtd", "Valor (R$)", "Prazo", "Pagamento", "Situação"], linhas);
    });
  }

  function montarTabelaCampanhas() {
    var alvo = $("#tabela-camp");
    if (!alvo) return;
    if (estado.ok.campanhas === false) { alvo.innerHTML = '<div class="vazio">A tabela de campanhas ainda não existe no banco. Rode o banco.sql e recarregue.</div>'; return; }
    var lista = campanhasVisiveis();
    var cab = COLUNAS.map(function (c) {
      var ativa = campOrdem.col === c.col;
      var seta = ativa ? (campOrdem.dir === 1 ? "↑" : "↓") : "↕";
      return '<th class="ordena' + (ativa ? " ativa" : "") + (c.num ? " num" : "") + '" data-col="' + c.col + '" tabindex="0" aria-sort="' + (ativa ? (campOrdem.dir === 1 ? "ascending" : "descending") : "none") + '">' +
        (c.curto ? '<span class="sr">' + c.rotulo + "</span>" + ic("estrela", "width:14px;height:14px;vertical-align:-2px") : c.rotulo) + '<span class="seta" aria-hidden="true">' + seta + "</span></th>";
    }).join("");
    var linhas = lista.length ? lista.map(function (c) {
      var st = FUNIL.indexOf(c.status);
      return '<tr class="clicavel' + (c.favorita ? " favorita" : "") + '" data-id="' + c.id + '" tabindex="0">' +
        '<td style="width:40px"><button class="btn-icone estrela' + (c.favorita ? " on" : "") + '" type="button" data-estrela aria-pressed="' + !!c.favorita + '" aria-label="' + (c.favorita ? "Tirar destaque" : "Destacar campanha") + '">' + ic("estrela") + "</button></td>" +
        "<td><b>" + esc(c.campanha) + "</b>" + (c.exemplo ? '<span class="etiqueta exemplo">exemplo</span>' : "") + (c.ativa === false ? ' <span class="suave" style="font-size:11px">(finalizada)</span>' : "") + "</td>" +
        "<td>" + esc(c.cliente || "") + "</td>" +
        '<td><span class="pilula ' + (c.tipo === "Publicidade" ? "tipo-publicidade" : "tipo-conteudo") + '">' + esc(c.tipo || "") + "</span></td>" +
        '<td><span class="pilula st-' + (st < 0 ? 0 : st) + '">' + esc(c.status || "") + "</span></td>" +
        '<td class="num">' + num(c.qtd) + "</td>" +
        '<td class="num">' + reais(c.valor) + "</td>" +
        '<td style="white-space:nowrap">' + dataBR(c.prazo) + avisoPrazo(c) + "</td>" +
        '<td><span class="' + (c.pagamento === "pago" ? "pago" : "pendente") + '">' + (c.pagamento === "pago" ? "Pago" : "Pendente") + "</span></td></tr>";
    }).join("") : '<tr><td colspan="9"><div class="vazio">' + (estado.campanhas.length ? "Nenhuma campanha com esse filtro." : "Nenhuma campanha ainda. Clique em \"Adicionar campanha\".") + "</div></td></tr>";
    alvo.innerHTML = '<table class="planilha"><thead><tr>' + cab + "</tr></thead><tbody>" + linhas + "</tbody></table>";

    function ordenar(th) {
      var col = th.dataset.col;
      if (campOrdem.col === col) campOrdem.dir *= -1; else campOrdem = { col: col, dir: 1 };
      montarTabelaCampanhas();
      var novo = alvo.querySelector('th[data-col="' + col + '"]');
      if (novo) novo.focus();
    }
    alvo.querySelector("thead").addEventListener("click", function (e) { var th = e.target.closest("th[data-col]"); if (th) ordenar(th); });
    alvo.querySelector("thead").addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches("th[data-col]")) { e.preventDefault(); ordenar(e.target); } });
    var tbody = alvo.querySelector("tbody");
    async function clique(e) {
      var tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      var c = estado.campanhas.find(function (x) { return x.id === Number(tr.dataset.id); });
      if (!c) return;
      if (e.target.closest("[data-estrela]")) {
        var r14 = await gravar("campanhas", { favorita: !c.favorita }, c.id);
        if (r14.erro) { toast(mensagemCurta(r14.erro), true); return; }
        trocarNaLista(estado.campanhas, r14.linha);
        montarTabelaCampanhas();
        return;
      }
      formularioCampanha(c);
    }
    tbody.addEventListener("click", clique);
    tbody.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.matches("tr")) clique(e); });
  }

  function formularioCampanha(c) {
    abrirFormulario({
      titulo: c ? "Editar campanha" : "Adicionar campanha",
      valores: c || { tipo: "Conteúdo", status: "Briefing", qtd: 1, valor: 0, pagamento: "pendente", ativa: true },
      campos: [
        { nome: "campanha", rotulo: "Campanha", obrigatorio: true, inteiro: true },
        { nome: "cliente", rotulo: "Cliente", lista: uniq(estado.marcas.map(function (m) { return m.nome; })) },
        { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: ["Conteúdo", "Publicidade"] },
        { nome: "status", rotulo: "Status", tipo: "select", opcoes: FUNIL },
        { nome: "prazo", rotulo: "Prazo", tipo: "date" },
        { nome: "qtd", rotulo: "Quantidade de vídeos", tipo: "number" },
        { nome: "valor", rotulo: "Valor total (R$)", tipo: "number", passo: "0.01" },
        { nome: "pagamento", rotulo: "Pagamento", tipo: "select", opcoes: [["pendente", "Pendente"], ["pago", "Pago"]] },
        { nome: "ativa", rotulo: "Campanha ativa (desmarque quando finalizar)", tipo: "check" },
        { nome: "favorita", rotulo: "Destacar com estrela", tipo: "check" }
      ],
      aoSalvar: async function (dados) {
        var r15 = await gravar("campanhas", dados, c && c.id);
        if (r15.erro) return mensagemCurta(r15.erro);
        trocarNaLista(estado.campanhas, r15.linha);
        toast(c ? "Campanha atualizada" : "Campanha adicionada");
        montarSeguro(abaAtual);
      },
      aoApagar: c ? async function () {
        var r16 = await apagar("campanhas", c.id);
        if (r16.erro) return mensagemCurta(r16.erro);
        estado.campanhas = estado.campanhas.filter(function (x) { return x.id !== c.id; });
        toast("Campanha apagada");
        montarSeguro(abaAtual);
      } : null
    });
  }

  /* ================= 11. ABA CHECKLIST ================= */
  var subAba = "checklist";
  var dobrasAbertas = {};
  var SUB_ABAS = [["checklist", "Checklist do portfólio"], ["referencias", "Referências de vídeo"], ["roteiros", "Roteiros"], ["ideias", "Ideias por nicho"], ["revisar", "Revisar meu roteiro"]];
  var CORES_REF = { areia: "#e7dcc9", coral: "#efc4b8", mostarda: "#ecd9a6", oliva: "#d6dac4", rosa: "#ebcfd1", terra: "#d9bca5" };

  function montarChecklist(corpo) {
    var B = window.Biblioteca;
    if (!B) {
      corpo.innerHTML = '<div class="bloco"><div class="vazio">Não encontrei o arquivo js/biblioteca.js. Confira se ele está na pasta js do projeto.</div></div>';
      return;
    }
    corpo.innerHTML = '<div class="sub-abas" role="tablist">' + SUB_ABAS.map(function (s) {
      return '<button type="button" role="tab" data-sub="' + s[0] + '" aria-selected="' + (subAba === s[0]) + '">' + s[1] + "</button>";
    }).join("") + '</div><div id="sub-corpo"></div>';
    $$(".sub-abas button", corpo).forEach(function (b) { b.addEventListener("click", function () { subAba = b.dataset.sub; montarSeguro("checklist"); }); });
    var alvo = $("#sub-corpo", corpo);
    try {
      if (subAba === "checklist") subChecklist(alvo, B);
      else if (subAba === "referencias") subReferencias(alvo, B);
      else if (subAba === "roteiros") subRoteiros(alvo, B);
      else if (subAba === "ideias") subIdeias(alvo, B);
      else subRevisar(alvo, B);
    } catch (e) {
      console.error(e);
      alvo.innerHTML = '<div class="vazio">Não consegui montar esta parte (' + esc(e.message) + ").</div>";
    }
  }
  function lista(x) { return Array.isArray(x) ? x : []; }
  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  function subChecklist(alvo, B) {
    var secoes = lista(B.CHECKLIST);
    function chaveDe(s, i) { return "checklist:" + s.id + ":" + i; }
    function feitosDe(s) { return lista(s.itens).filter(function (it, i) { return estado.marcados[chaveDe(s, i)]; }).length; }
    var totalItens = secoes.reduce(function (n, s) { return n + lista(s.itens).length; }, 0);
    var totalFeitos = secoes.reduce(function (n, s) { return n + feitosDe(s); }, 0);
    alvo.innerHTML = (estado.ok.marcados === false ? '<div class="aviso" style="margin-bottom:12px">As marcações não vão ficar salvas porque a tabela <b>marcados</b> ainda não existe. Rode o banco.sql.</div>' : "") +
      '<div class="progresso-geral"><b id="geral-num">' + totalFeitos + " de " + totalItens + '</b><div class="progresso"><i id="geral-barra" style="width:' + pct(totalFeitos, totalItens) + '%"></i></div><span id="geral-pct">' + pct(totalFeitos, totalItens) + "% pronto</span></div>" +
      secoes.map(function (s) {
        var f = feitosDe(s), t = lista(s.itens).length;
        return '<details class="dobra" data-secao="' + esc(s.id) + '"' + (dobrasAbertas["c:" + s.id] ? " open" : "") + ">" +
          "<summary>" + ic("seta", "width:14px;height:14px").replace('class="ic"', 'class="ic seta-d"') + "<span>" + esc(s.emoji || "") + " </span>" +
            '<span><span class="titulo-d">' + esc(s.nome) + '</span><span class="resumo-d">' + esc(s.resumo || "") + "</span></span>" +
            '<span class="lado"><span class="conta">' + f + "/" + t + '</span><span class="progresso"><i style="width:' + pct(f, t) + '%"></i></span></span></summary>' +
          '<div class="dobra-corpo">' + (s.porque ? '<div class="porque"><b>Por que importa:</b> ' + htmlSeguro(s.porque) + "</div>" : "") +
            '<ul class="itens-check">' + lista(s.itens).map(function (it, i) {
              var k = chaveDe(s, i);
              return '<li><label><input type="checkbox" data-chave="' + esc(k) + '"' + (estado.marcados[k] ? " checked" : "") + '><span><span class="t">' + htmlSeguro(it.t) + '</span><span class="d">' + htmlSeguro(it.d || "") + "</span></span></label></li>";
            }).join("") + "</ul></div></details>";
      }).join("");

    $$("details.dobra", alvo).forEach(function (d) { d.addEventListener("toggle", function () { dobrasAbertas["c:" + d.dataset.secao] = d.open; }); });
    alvo.addEventListener("change", async function (e) {
      var cx = e.target.closest("input[data-chave]");
      if (!cx) return;
      var k = cx.dataset.chave, on = cx.checked;
      if (on) estado.marcados[k] = true; else delete estado.marcados[k];
      atualizarProgresso();
      if (estado.ok.marcados === false) return;
      var r17 = on
        ? await banco.from("marcados").upsert({ chave: k }, { onConflict: "chave" })
        : await banco.from("marcados").delete().eq("chave", k);
      if (r17.error) toast(mensagemCurta(r17.error), true);
    });
    function atualizarProgresso() {
      var tf = 0;
      secoes.forEach(function (s) {
        var f = feitosDe(s), t = lista(s.itens).length; tf += f;
        var d = alvo.querySelector('details[data-secao="' + CSS.escape(s.id) + '"]');
        if (!d) return;
        d.querySelector(".conta").textContent = f + "/" + t;
        d.querySelector(".lado .progresso i").style.width = pct(f, t) + "%";
      });
      $("#geral-num").textContent = tf + " de " + totalItens;
      $("#geral-barra").style.width = pct(tf, totalItens) + "%";
      $("#geral-pct").textContent = pct(tf, totalItens) + "% pronto";
    }
  }

  function subReferencias(alvo, B) {
    var refs = lista(B.REFERENCIAS);
    alvo.innerHTML = '<div class="grade-ref">' + refs.map(function (r, i) {
      var id = idYouTube(r.youtube);
      return '<button class="cartao-ref" type="button" data-ref="' + i + '"><div class="capa" style="background:' + (CORES_REF[r.cor] || "var(--card)") + '">' +
        (id ? '<img src="' + capaYT(id, true) + '" data-reserva="' + capaYT(id) + '" alt="" loading="lazy">' : "") +
        '<span class="emoji" aria-hidden="true">' + esc(r.emoji || "") + "</span></div>" +
        "<b>" + esc(r.titulo) + "</b><span>" + esc([r.estilo, r.duracao, r.marca].filter(Boolean).join(" · ")) + "</span></button>";
    }).join("") + "</div>";
    alvo.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ref]");
      if (!b) return;
      var r = refs[Number(b.dataset.ref)];
      var html = '<div class="janela-corpo ficha">' +
        '<p class="suave" style="font-size:12.5px">' + esc([r.estilo, r.audiencia, r.duracao, r.marca].filter(Boolean).join(" · ")) + "</p>" +
        "<h4>Gancho</h4><p>" + htmlSeguro(r.gancho) + "</p>" +
        "<h4>Por que funciona</h4><p>" + htmlSeguro(r.porque) + "</p>" +
        "<h4>Diferencial</h4><p>" + htmlSeguro(r.diferencial) + "</p>" +
        "<h4>Erro comum</h4><p>" + htmlSeguro(r.erro) + "</p>" +
        '<h4>Roteiro</h4><div class="blocos-tempo">' + lista(r.roteiro).map(function (b2) { return '<div><span class="tempo">' + esc(b2.t) + "</span><span>" + htmlSeguro(b2.o) + "</span></div>"; }).join("") + "</div>" +
        "</div>" +
        '<div class="janela-rodape"><button class="btn" type="button" data-fechar>Fechar</button>' + (r.youtube ? '<a class="btn principal" href="' + esc(r.youtube) + '" target="_blank" rel="noopener">' + ic("externo", "width:15px;height:15px") + " Assistir</a>" : "") + "</div>";
      abrirJanela((r.emoji ? r.emoji + " " : "") + r.titulo, html, true);
    });
  }

  function subRoteiros(alvo, B) {
    alvo.innerHTML = lista(B.TIPOS).map(function (t) {
      return '<details class="dobra" data-tipo="' + esc(t.id) + '"' + (dobrasAbertas["t:" + t.id] ? " open" : "") + "><summary>" + ic("seta", "width:14px;height:14px").replace('class="ic"', 'class="ic seta-d"') +
        "<span>" + esc(t.emoji || "") + ' </span><span class="titulo-d">' + esc(t.nome) + '</span><span class="lado">' + esc(t.duracao || "") + "</span></summary>" +
        '<div class="dobra-corpo"><div class="porque"><b>Quando usar:</b> ' + htmlSeguro(t.porque || "") + "</div>" +
        '<div class="blocos-tempo">' + lista(t.beats).map(function (b) { return '<div><span class="tempo">' + esc(b.t) + "</span><span>" + htmlSeguro(b.o) + "</span></div>"; }).join("") + "</div>" +
        (lista(t.erros).length ? '<p style="margin:12px 0 4px;font-size:12px;font-weight:500">Erros comuns</p><ul style="margin:0;padding-left:18px;font-size:13px">' + lista(t.erros).map(function (x) { return "<li>" + htmlSeguro(x) + "</li>"; }).join("") + "</ul>" : "") +
        "</div></details>";
    }).join("");
    $$("details.dobra", alvo).forEach(function (d) { d.addEventListener("toggle", function () { dobrasAbertas["t:" + d.dataset.tipo] = d.open; }); });
  }

  function subIdeias(alvo, B) {
    var dicas = lista(B.COMO_USAR);
    alvo.innerHTML = (dicas.length ? '<div class="bloco"><div class="bloco-topo"><h3>Como usar os ganchos</h3></div><div class="bloco-corpo"><ul style="margin:0;padding-left:18px;font-size:13px;display:grid;gap:4px">' +
        dicas.map(function (d) { return "<li>" + htmlSeguro(d) + "</li>"; }).join("") + "</ul></div></div>" : "") +
      '<div class="ideias">' + lista(B.NICHOS).map(function (n) {
        return '<div class="bloco" style="margin:0"><div class="bloco-topo"><h3>' + esc(n.emoji || "") + " " + esc(n.nome) + '</h3></div><div class="bloco-corpo"><ul>' +
          lista(n.ideias).map(function (i) { return "<li><b>" + htmlSeguro(i.t) + "</b><i>“" + htmlSeguro(i.gancho) + "”</i></li>"; }).join("") + "</ul></div></div>";
      }).join("") + "</div>";
  }

  function subRevisar(alvo, B) {
    var blocos = lista(B.REVISAO);
    var marcasRev = {};
    try { marcasRev = JSON.parse(localStorage.getItem("np-revisao") || "{}") || {}; } catch (e) { marcasRev = {}; }
    var rascunho = "";
    try { rascunho = localStorage.getItem("np-roteiro-rascunho") || ""; } catch (e) {}
    var total = blocos.reduce(function (n, b) { return n + lista(b.itens).length; }, 0);
    function feitos() { return Object.keys(marcasRev).filter(function (k) { return marcasRev[k]; }).length; }
    alvo.innerHTML = '<div class="revisar">' +
      '<div class="bloco" style="margin:0"><div class="bloco-topo"><h3>Cole o seu roteiro aqui</h3></div><div class="bloco-corpo"><textarea class="campo" id="roteiro-texto" aria-label="Seu roteiro" placeholder="Cole ou escreva o roteiro. Ele fica guardado neste navegador enquanto você revisa.">' + esc(rascunho) + "</textarea></div></div>" +
      "<div>" +
        '<div class="progresso-geral"><b id="rev-num">' + feitos() + " de " + total + '</b><div class="progresso"><i id="rev-barra" style="width:' + pct(feitos(), total) + '%"></i></div><button class="btn pequeno" type="button" id="rev-limpar">Limpar marcações</button></div>' +
        blocos.map(function (b, bi) {
          return '<div class="bloco"><div class="bloco-topo"><h3>' + esc(b.emoji || "") + " " + esc(b.bloco) + '</h3></div><div class="bloco-corpo" style="padding-top:0;padding-bottom:4px"><ul class="itens-check">' +
            lista(b.itens).map(function (it, ii) {
              var k = bi + ":" + ii;
              return '<li><label><input type="checkbox" data-rev="' + k + '"' + (marcasRev[k] ? " checked" : "") + '><span><span class="t">' + htmlSeguro(it.t) + '</span><span class="d">' + htmlSeguro(it.d || "") + "</span></span></label></li>";
            }).join("") + "</ul></div></div>";
        }).join("") +
      "</div></div>";
    function atualizar() {
      $("#rev-num").textContent = feitos() + " de " + total;
      $("#rev-barra").style.width = pct(feitos(), total) + "%";
      try { localStorage.setItem("np-revisao", JSON.stringify(marcasRev)); } catch (e) {}
    }
    alvo.addEventListener("change", function (e) {
      var cx = e.target.closest("input[data-rev]");
      if (!cx) return;
      if (cx.checked) marcasRev[cx.dataset.rev] = true; else delete marcasRev[cx.dataset.rev];
      atualizar();
    });
    $("#roteiro-texto").addEventListener("input", function (e) { try { localStorage.setItem("np-roteiro-rascunho", e.target.value); } catch (x) {} });
    $("#rev-limpar").addEventListener("click", function () {
      marcasRev = {};
      $$("input[data-rev]", alvo).forEach(function (c) { c.checked = false; });
      atualizar();
    });
  }

  /* ================= 12. COMEÇAR ================= */
  irPara(location.hash.slice(1) || "portfolio");
})();
