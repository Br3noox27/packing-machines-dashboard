var DADOS = [];
var FILTRO = 'hoje';
var PMS = ['PM01 - IF21','PM02 - IF21','PM03 - IF21','PM04 - IF21','PM05 - IF21','PM06 - IF21','PM07 - IF22','PM08 - IF22','PM09 - IF22','PM10 - IF22','PM11 - IF22','PM12 - IF22'];
var COL = {
  data:0, turno:1, maquina:2,
  conforme:3, detalheParametro:4,
  teflonBarra:5,
  teflonSeladora:6, obsTeflonBarra:11,
  sensor:7, obsSensor:12,
  funcionamento:8, obsFuncionamento:9,
  turnoCode:10,
  obsTeflonSel:13,
  impressao:14, obsImpressao:15,
  checkItens:16, obsGeral:17
};
var lineChartInstance = null;
var pmProblemsChartInstance = null;
var pmConformChartInstance = null;
var pmParamsPieInstance = null;
var modalMensalChart = null;
var _modalMesFoco = null;
var pmEvolChartInstance = null;
var doughnutChartInstance = null;

document.getElementById('data-hoje').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

/* --- TEMA DOS GRÁFICOS --- */
function getChartColors() {
  var dark = document.documentElement.classList.contains('dark');
  return {
    dark:      dark,
    grid:      dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tick:      dark ? '#888' : '#666',
    blue:      '#3b82f6',
    blueAlpha: dark ? 'rgba(59,130,246,0.20)' : 'rgba(59,130,246,0.08)',
    orange:    '#ff7733',
    tooltip:   dark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.96)',
    tooltipTxt:dark ? '#fff' : '#111',
    tooltipBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };
}

/* --- DARK MODE --- */
function _updateChartsTheme() {
  var dtc = getChartColors();
  var allCharts = [lineChartInstance, doughnutChartInstance, pmEvolChartInstance,
    dTendencia, dProblemas, dPareto, dParams, window._dParadas, impStackedChart, impCorrigidasChart,
    modalMensalChart, pmParamsPieInstance, dTurnos, dImpressao, dCheckItens,
    anConformidade, anProblemas, anPareto, anParams, anTurnos, anImpressao, anCheckItens];
  allCharts.forEach(function(ch) {
    if (!ch) return;
    ['x','y'].forEach(function(ax) {
      if (ch.options.scales && ch.options.scales[ax]) {
        if (ch.options.scales[ax].ticks) ch.options.scales[ax].ticks.color = dtc.tick;
        if (ch.options.scales[ax].grid)  ch.options.scales[ax].grid.color  = dtc.grid;
      }
    });
    if (ch.options.plugins) {
      if (ch.options.plugins.legend && ch.options.plugins.legend.labels)
        ch.options.plugins.legend.labels.color = dtc.tooltipTxt;
      if (ch.options.plugins.tooltip) {
        Object.assign(ch.options.plugins.tooltip, {
          backgroundColor: dtc.tooltip, titleColor: dtc.tooltipTxt,
          bodyColor: dtc.tooltipTxt, borderColor: dtc.tooltipBorder
        });
      }
    }
    ch.update('none');
  });
  window.render();
}
window.toggleDark = function() {
  var isDark = document.documentElement.classList.toggle('dark');
  document.getElementById('dark-btn').textContent = isDark ? '☀️ Claro' : '🌙 Escuro';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  _updateChartsTheme();
}
// Carrega tema salvo
if(localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
  document.getElementById('dark-btn').textContent = '☀️ Claro';
}

/* --- TABS --- */
window.setTab = function(tab, btn) {
  document.querySelectorAll('.tab').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-pms').style.display        = tab === 'pms'        ? 'block' : 'none';
  document.getElementById('tab-desempenho').style.display = tab === 'desempenho' ? 'block' : 'none';
  if (tab === 'desempenho') renderDesemp();
}
window.irParaDesempenho = function() {
  var btn = document.querySelector('.tab:nth-child(2)');
  window.setTab('desempenho', btn);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- DESEMPENHO --- */
var FILTRO_D = 'hoje';
var _filtroDiaD = null, _filtroMesD = null, _filtroAnoD = null;
var dTendencia = null, dProblemas = null, dPareto = null, dParams = null;
var dTurnos = null, dImpressao = null, dCheckItens = null;
var anConformidade = null, anProblemas = null, anPareto = null, anParams = null;
var anTurnos = null, anImpressao = null, anCheckItens = null;

function _updateStripLabel() {
  var el = document.getElementById('strip-filtro-label');
  if (!el) return;
  if (FILTRO_D === 'hoje') el.textContent = 'Hoje';
  else if (FILTRO_D === 'geral') el.textContent = 'Geral (todo o período)';
  else if (FILTRO_D === 'dia-especifico' && _filtroDiaD) el.textContent = _filtroDiaD.toLocaleDateString('pt-BR');
  else if (FILTRO_D === 'mes-especifico') { var meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; el.textContent = meses[_filtroMesD]+' '+_filtroAnoD; }
  else el.textContent = '';
}

window.setFiltroDesemp = function(f, btn) {
  FILTRO_D = f;
  _filtroDiaD = null; _filtroMesD = null;
  document.getElementById('periodo-picker-d').style.display = 'none';
  document.getElementById('dp-dia').value = '';
  document.getElementById('dp-mes').value = '';
  document.querySelectorAll('#tab-desempenho .f-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  _updateStripLabel();
  renderDesemp();
}

window.togglePeriodoPickerD = function(btn) {
  var pk = document.getElementById('periodo-picker-d');
  var open = pk.style.display === 'block';
  pk.style.display = open ? 'none' : 'block';
  if (!open) {
    var sel = document.getElementById('dp-ano');
    if (!sel.options.length) {
      var y = new Date().getFullYear();
      for (var i = y; i >= y-4; i--) { var o = document.createElement('option'); o.value=i; o.textContent=i; sel.appendChild(o); }
      sel.value = y;
    }
  }
}

window.setPeriodoDiaD = function() {
  var val = document.getElementById('dp-dia').value;
  if (!val) return;
  var parts = val.split('-');
  var ano = parseInt(parts[0]); if (ano < 2000 || ano > 2099) return;
  var d = new Date(ano, parseInt(parts[1])-1, parseInt(parts[2]));
  d.setHours(0,0,0,0);
  _filtroDiaD = d; _filtroMesD = null;
  document.getElementById('dp-mes').value = '';
  FILTRO_D = 'dia-especifico';
  document.querySelectorAll('#tab-desempenho .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('df-periodo').classList.add('active');
  document.getElementById('periodo-picker-d').style.display = 'none';
  _updateStripLabel();
  renderDesemp();
}

window.setPeriodoMesD = function() {
  var m = document.getElementById('dp-mes').value;
  var a = document.getElementById('dp-ano').value;
  if (m === '' || !a) return;
  _filtroMesD = parseInt(m); _filtroAnoD = parseInt(a); _filtroDiaD = null;
  document.getElementById('dp-dia').value = '';
  FILTRO_D = 'mes-especifico';
  document.querySelectorAll('#tab-desempenho .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('df-periodo').classList.add('active');
  document.getElementById('periodo-picker-d').style.display = 'none';
  _updateStripLabel();
  renderDesemp();
}

window.clearPeriodoD = function() {
  _filtroDiaD = null; _filtroMesD = null;
  document.getElementById('dp-dia').value = '';
  document.getElementById('dp-mes').value = '';
  document.getElementById('periodo-picker-d').style.display = 'none';
  FILTRO_D = 'hoje';
  document.querySelectorAll('#tab-desempenho .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('df-hoje').classList.add('active');
  _updateStripLabel();
  renderDesemp();
}

document.addEventListener('click', function(e) {
  var pk = document.getElementById('periodo-picker-d');
  var btn = document.getElementById('df-periodo');
  if (pk && btn && !pk.contains(e.target) && e.target !== btn) pk.style.display = 'none';
});

function filtrarDesemp() {
  var n = new Date();
  var hj = _dk(n);
  var ot = new Date(n); ot.setDate(n.getDate()-1); var otN = _dk(ot);
  return DADOS.filter(function(row) {
    var d = window.parseData(row); if (!d || isNaN(d)) return false;
    var dk = _dk(d);
    if (FILTRO_D==='hoje')   return dk===hj;
    if (FILTRO_D==='ontem')  return dk===otN;
    if (FILTRO_D==='dia-especifico' && _filtroDiaD) return dk===_dk(_filtroDiaD);
    if (FILTRO_D==='mes-especifico' && _filtroMesD!=null) return d.getFullYear()===_filtroAnoD && d.getMonth()===_filtroMesD;
    return true;
  });
}

function pmDisplayName(pm) {
  // 'PM01 - IF21' → { num: 'PM01', line: 'Infeed 21' }
  var parts = pm.split(' - ');
  var num = parts[0];
  var raw = parts[1] || '';
  var line = raw.replace('IF21','Infeed 21').replace('IF22','Infeed 22');
  return { num: num, line: line };
}

function renderDesemp() {
  var dados = filtrarDesemp();

  // Strip usa dados do filtro selecionado
  var dadosHoje = dados;

  // --- STRIP DE MÁQUINAS ---
  function pmMiniCard(pm, p) {
    var dn = pmDisplayName(pm);
    if (!p) {
      return '<div class="pm-mini nd">'
        + '<div class="pm-mini-header"><span class="pm-mini-num">'+dn.num+'</span><span class="pm-mini-status">Sem dados</span></div>'
        + '<div class="pm-mini-footer"><span class="pm-mini-footer-txt">'+dn.line+' · sem registros</span></div>'
        + '</div>';
    }
    var totalErros = p.nc + p.teflonBarra + p.teflonSeladora + p.sensor + p.funcionamento + p.impressao;
    var cls = p.parada ? 'crit' : (totalErros === 0 ? 'ok' : 'warn');
    var statusLabel = p.parada
      ? '🔴 MÁQUINA PARADA'
      : (totalErros === 0 ? 'OK' : 'Atenção') + ' · ' + totalErros + ' problemas';
    function tVal(v){ return v==='Sim'?'<span class="turno-val t-ok">Conforme</span>':v==='Não'?'<span class="turno-val t-no">Não conforme</span>':'<span class="turno-val t-nd">—</span>'; }
    return '<div class="pm-mini '+cls+(p.parada?' pm-parada':'')+'" onclick="window.openModal(\''+pm+'\')">'+
      '<div class="pm-mini-header"><span class="pm-mini-num">'+dn.num+' <span style="font-size:11px;font-weight:500;color:#aaa">'+dn.line+'</span></span><span class="pm-mini-status">'+statusLabel+'</span></div>'+
      '<div class="pm-mini-turnos">'+
        '<div class="pm-mini-turno"><div class="pm-mini-turno-label">Início do dia</div>'+tVal(p.inicio)+'</div>'+
        '<div class="pm-mini-turno"><div class="pm-mini-turno-label">Final do dia</div>'+tVal(p.final)+'</div>'+
      '</div>'+
      '<div class="pm-mini-details">'+
        '<div class="pm-mini-det"><span class="pm-mini-det-label">Inspeções</span><span class="pm-mini-det-val">'+p.total+'</span></div>'+
        '<div class="pm-mini-det"><span class="pm-mini-det-label">Param. Err.</span><span class="pm-mini-det-val'+(p.nc>0?' al':'')+'">'+p.nc+'/6</span></div>'+
        '<div class="pm-mini-det"><span class="pm-mini-det-label">Teflon Barra</span><span class="pm-mini-det-val'+(p.teflonBarra>0?' al':'')+'">'+p.teflonBarra+'</span></div>'+
        '<div class="pm-mini-det"><span class="pm-mini-det-label">Teflon Sel.</span><span class="pm-mini-det-val'+(p.teflonSeladora>0?' al':'')+'">'+p.teflonSeladora+'</span></div>'+
        '<div class="pm-mini-det"><span class="pm-mini-det-label">Sensor</span><span class="pm-mini-det-val'+(p.sensor>0?' al':'')+'">'+p.sensor+'</span></div>'+
        (p.funcionamento>0 ? '<div class="pm-mini-det" style="grid-column:1/-1"><span class="pm-mini-det-label" style="color:#cc2200">Vezes parada</span><span class="pm-mini-det-val al" style="color:#cc2200;font-weight:700">'+p.funcionamento+'×</span></div>' : '')+
      '</div>'+
      '<div class="pm-mini-footer"><span class="pm-mini-footer-txt">Última: '+p.hora+' · Toque para detalhes</span></div>'+
      '</div>';
  }

  // Paradas primeiro, depois por total de erros
  var pmComDados = PMS.map(function(pm){ return { pm:pm, p:window.calcPM(dadosHoje,pm) }; })
    .sort(function(a,b){
      var pa = a.p && a.p.parada ? 1 : 0;
      var pb = b.p && b.p.parada ? 1 : 0;
      if (pb !== pa) return pb - pa; // paradas primeiro
      var ea = a.p ? a.p.nc+a.p.teflonBarra+a.p.teflonSeladora+a.p.sensor+a.p.funcionamento+a.p.impressao : 0;
      var eb = b.p ? b.p.nc+b.p.teflonBarra+b.p.teflonSeladora+b.p.sensor+b.p.funcionamento+b.p.impressao : 0;
      return eb - ea;
    });

  window._pmTodas = pmComDados;
  window._verTodas = false;


  window.toggleMaisGraficos = function() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('nav-tabs').style.display = 'none';
    document.getElementById('page-analise').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // sincroniza botão de filtro ativo
    var map = { 'hoje':'an-f-hoje', 'geral':'an-f-geral' };
    window._syncAnFiltroBtn(map[FILTRO_D] || 'an-f-periodo');
    setTimeout(function(){ renderAnalise(); }, 30);
  };
  window.voltarDashboard = function() {
    document.getElementById('page-analise').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('nav-tabs').style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window._syncAnFiltroBtn = function(id) {
    ['an-f-hoje','an-f-geral','an-f-periodo'].forEach(function(b){ var el=document.getElementById(b); if(el) el.classList.remove('active'); });
    var el=document.getElementById(id); if(el) el.classList.add('active');
  }
  window.setFiltroAnalise = function(f, btn) {
    FILTRO_D = f; _filtroDiaD = null; _filtroMesD = null;
    document.getElementById('periodo-picker-an').style.display = 'none';
    document.getElementById('an-dp-dia').value = '';
    document.getElementById('an-dp-mes').value = '';
    window._syncAnFiltroBtn(btn ? btn.id : 'an-f-hoje');
    renderAnalise();
  };
  window.togglePeriodoAnalise = function(btn) {
    var pk = document.getElementById('periodo-picker-an');
    pk.style.display = pk.style.display === 'none' ? 'block' : 'none';
    // popula anos
    var sel = document.getElementById('an-dp-ano');
    if(sel && !sel.options.length) { var y=new Date().getFullYear(); for(var i=y;i>=y-5;i--) sel.add(new Option(i,i)); }
  };
  window.setPeriodoDiaAN = function() {
    var v = document.getElementById('an-dp-dia').value; if(!v) return;
    var p = v.split('-'); _filtroDiaD = new Date(+p[0],+p[1]-1,+p[2]); _filtroMesD = null;
    FILTRO_D = 'dia-especifico';
    document.getElementById('periodo-picker-an').style.display = 'none';
    window._syncAnFiltroBtn('an-f-periodo');
    renderAnalise();
  };
  window.setPeriodoMesAN = function() {
    var m = document.getElementById('an-dp-mes').value; var a = document.getElementById('an-dp-ano').value;
    if(m===''||!a) return;
    _filtroMesD = parseInt(m); _filtroAnoD = parseInt(a); _filtroDiaD = null;
    FILTRO_D = 'mes-especifico';
    document.getElementById('periodo-picker-an').style.display = 'none';
    window._syncAnFiltroBtn('an-f-periodo');
    renderAnalise();
  };
  window.clearPeriodoAN = function() {
    _filtroDiaD = null; _filtroMesD = null;
    document.getElementById('an-dp-dia').value = '';
    document.getElementById('an-dp-mes').value = '';
    document.getElementById('periodo-picker-an').style.display = 'none';
    FILTRO_D = 'hoje'; window._syncAnFiltroBtn('an-f-hoje');
    renderAnalise();
  };
  document.addEventListener('click', function(e) {
    var pk = document.getElementById('periodo-picker-an');
    var btn = document.getElementById('an-f-periodo');
    if(pk && btn && !pk.contains(e.target) && e.target !== btn) pk.style.display = 'none';
  });

  window._todasFiltroAtual = 'todos';

  window._renderTodasGrid = function(filtro) {
    var lista = window._pmTodas || [];
    var filtrada = filtro === 'todos' ? lista : lista.filter(function(x){
      return x.pm.toUpperCase().indexOf(filtro) !== -1;
    });
    var paradas = filtrada.filter(function(x){ return x.p && x.p.parada; });
    var count = document.getElementById('todas-maquinas-count');
    if (count) count.textContent = filtrada.length + ' máquinas' + (paradas.length ? ' · ' + paradas.length + ' parada(s)' : '');
    var grid = document.getElementById('todas-maquinas-grid');
    if (grid) grid.innerHTML = filtrada.map(function(x){ return pmMiniCard(x.pm, x.p); }).join('');
  };

  window.filtrarTodasMaquinas = function(filtro, btn) {
    window._todasFiltroAtual = filtro;
    document.querySelectorAll('#page-todas-maquinas .f-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    window._renderTodasGrid(filtro);
  };

  window.toggleVerTodas = function() {
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('nav-tabs').style.display = 'none';
    document.getElementById('page-todas-maquinas').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // reset filtro para "Todas" ao abrir
    window._todasFiltroAtual = 'todos';
    document.querySelectorAll('#page-todas-maquinas .f-btn').forEach(function(b){ b.classList.remove('active'); });
    var btnTodos = document.getElementById('tm-f-todos');
    if (btnTodos) btnTodos.classList.add('active');
    window._renderTodasGrid('todos');
  };

  window.voltarDeTodasMaquinas = function() {
    document.getElementById('page-todas-maquinas').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('nav-tabs').style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Renderiza top 3 por padrão
  document.getElementById('desemp-strip').innerHTML = PMS.map(function(pm) {
    var p = window.calcPM(dadosHoje, pm);
    var dn = pmDisplayName(pm);
    var cls, statusTxt;
    if (!p) { cls = 'sb-nd'; statusTxt = 'Sem dados'; }
    else if (p.parada) { cls = 'sb-crit'; statusTxt = 'PARADA'; }
    else { cls = 'sb-ok'; statusTxt = 'Normal'; }
    return '<div class="pm-status-box ' + cls + '" onclick="window.openModal(\'' + pm + '\')">'
      + '<div style="flex:1;min-width:0;">'
      +   '<div class="pm-status-box-name">' + dn.num + '</div>'
      +   '<div class="pm-status-box-line">' + dn.line + '</div>'
      + '</div>'
      + '<div class="pm-status-box-status">' + statusTxt + '</div>'
      + '</div>';
  }).join('');
  var btnVer = document.getElementById('btn-ver-todas');
  if (btnVer) { btnVer.textContent = 'Ver todas ('+PMS.length+') →'; }

  // --- STATUS GRID TABLE ---
  (function() {
    var now = new Date(); now.setHours(0,0,0,0);
    var cols = [
      { label: 'D-3', date: new Date(now.getFullYear(), now.getMonth(), now.getDate()-3) },
      { label: 'D-2', date: new Date(now.getFullYear(), now.getMonth(), now.getDate()-2) },
      { label: 'D-1', date: new Date(now.getFullYear(), now.getMonth(), now.getDate()-1) },
      { label: 'Hoje', date: now }
    ];
    var html = '<table class="sg-table"><tr><th class="sg-th">Máquina</th>';
    cols.forEach(function(c){ html += '<th class="sg-th">'+c.label+'</th>'; });
    html += '</tr>';
    PMS.forEach(function(pm) {
      var dn = pmDisplayName(pm);
      html += '<tr><td class="sg-td-name">'+dn.num+' <span style="font-size:10px;color:#aaa;font-weight:400;">'+dn.line+'</span></td>';
      cols.forEach(function(c) {
        var dadosDia = DADOS.filter(function(r) {
          var d = window.parseData(r); if (!d) return false;
          return _dk(d) === _dk(c.date);
        });
        var p = window.calcPM(dadosDia, pm);
        if (!p) {
          html += '<td class="sg-td sg-nd">—</td>';
        } else {
          var erros = p.nc + p.teflonBarra + p.teflonSeladora + p.sensor + p.funcionamento + p.impressao;
          if (p.parada) {
            html += '<td class="sg-td sg-crit">PARADA</td>';
          } else if (erros > 0) {
            html += '<td class="sg-td sg-warn">'+erros+' prob.</td>';
          } else {
            html += '<td class="sg-td sg-ok">OK</td>';
          }
        }
      });
      html += '</tr>';
    });
    html += '</table>';
    var el = document.getElementById('status-grid-table');
    if (el) el.innerHTML = html;
  })();

  var pmDados = PMS.map(function(pm){ return window.calcPM(dados, pm); }).filter(Boolean);

  // --- TENDÊNCIA ---
  var hist = {};
  dados.forEach(function(r){
    var d = window.parseData(r); if(!d) return;
    var k = d.toLocaleDateString('pt-BR');
    if(!hist[k]) hist[k]={soma:0,tot:0};
    var ok=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
    if(r[COL.teflonBarra]==='Não')    ok++;
    if(r[COL.teflonSeladora]==='Não') ok++;
    if(r[COL.sensor]==='Sim')         ok++;
    if(r[COL.funcionamento]==='Sim')  ok++;
    if(r[COL.impressao]==='Sim')      ok++;
    hist[k].soma+=(ok/6)*100; hist[k].tot++;
  });
  var datas = Object.keys(hist).sort(function(a,b){ return a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')); }).slice(-30);
  var tLab = datas.map(function(s){ return s.substring(0,5); });
  var tDat = datas.map(function(s){ return Math.round(hist[s].soma/hist[s].tot); });

  var dtc = getChartColors();

  // --- EVOLUÇÃO COMPLETA (todos os dias históricos) ---
  (function() {
    var allDayMap = {};
    DADOS.forEach(function(r) {
      var d = window.parseData(r); if (!d || isNaN(d)) return;
      var k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      if (!allDayMap[k]) allDayMap[k] = { soma:0, qtd:0 };
      var ok=0;
      if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
      if(r[COL.teflonBarra]==='Não')    ok++;
      if(r[COL.teflonSeladora]==='Não') ok++;
      if(r[COL.sensor]==='Sim')         ok++;
      if(r[COL.funcionamento]==='Sim')  ok++;
      if(r[COL.impressao]==='Sim')      ok++;
      allDayMap[k].soma += (ok/6)*100; allDayMap[k].qtd++;
    });
    var sortedKeys = Object.keys(allDayMap).sort();
    var evolLabels = sortedKeys.map(function(k){ var p=k.split('-'); return p[2]+'/'+p[1]; });
    var evolData   = sortedKeys.map(function(k){ return Math.round(allDayMap[k].soma/allDayMap[k].qtd); });

    var lastVal = evolData.length ? evolData[evolData.length-1] : null;
    var prevVal = evolData.length>1 ? evolData[evolData.length-2] : null;
    var valEl = document.getElementById('pm-evol-val');
    var badgeEl = document.getElementById('pm-evol-badge');
    if (valEl) valEl.textContent = lastVal !== null ? lastVal+'%' : '—';
    if (badgeEl && lastVal !== null && prevVal !== null) {
      var diff = lastVal - prevVal;
      if (diff > 0) { badgeEl.textContent='▲ +'+diff+'% vs dia anterior'; badgeEl.className='pm-evolution-badge up'; }
      else if (diff < 0) { badgeEl.textContent='▼ '+diff+'% vs dia anterior'; badgeEl.className='pm-evolution-badge down'; }
      else { badgeEl.textContent='= estável'; badgeEl.className='pm-evolution-badge flat'; }
    }

    if (pmEvolChartInstance) pmEvolChartInstance.destroy();
    var ctxE = document.getElementById('pm-evol-chart'); if (!ctxE) return;
    pmEvolChartInstance = new Chart(ctxE.getContext('2d'), {
      type:'line',
      data:{ labels:evolLabels, datasets:[{
        data:evolData, borderColor:'#3b82f6', borderWidth:0.8,
        pointRadius:0, pointHoverRadius:4, pointHoverBackgroundColor:'#3b82f6',
        fill:true, tension:0.35,
        backgroundColor: function(ctx){ var chart=ctx.chart,ca=chart.chartArea,c=chart.ctx; if(!ca) return 'transparent'; var g=c.createLinearGradient(0,ca.top,0,ca.bottom); g.addColorStop(0,dtc.dark?'rgba(59,130,246,0.22)':'rgba(59,130,246,0.10)'); g.addColorStop(1,'rgba(59,130,246,0)'); return g; }
      }]},
      options:{ responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8, padding:10, callbacks:{ title:function(items){ return items[0].label; }, label:function(c){ return ' '+c.formattedValue+'%'; } } } },
        scales:{
          y:{ min:0, max:100, grid:{color:dtc.grid}, border:{display:false}, ticks:{callback:function(v){return v+'%';}, color:dtc.tick, font:{size:10}, maxTicksLimit:5} },
          x:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}, maxTicksLimit:4, maxRotation:0} }
        }
      }
    });
  })();

  // --- PROBLEMAS POR PM ---
  var pmProb = pmDados.map(function(p){ return { pm:p.pm.split(' ')[0], tot:p.nc+p.teflonBarra+p.teflonSeladora+p.sensor }; })
    .filter(function(p){ return p.tot>0; }).sort(function(a,b){ return b.tot-a.tot; });

  if(dProblemas) dProblemas.destroy();
  var ctxP = document.getElementById('d-problemas');
  if(ctxP) dProblemas = new Chart(ctxP.getContext('2d'),{
    type:'bar',
    data:{ labels:pmProb.map(function(p){ return p.pm; }), datasets:[{
      data:pmProb.map(function(p){ return p.tot; }),
      backgroundColor:pmProb.map(function(p,i){ return i===0?'#ff4d4d':i<=2?'#ff7733':i<=4?'#ff9933':'#3b82f6'; }),
      borderRadius:6, borderWidth:0
    }]},
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false},
        tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8 }
      },
      scales:{
        x:{ beginAtZero:true, ticks:{maxTicksLimit:3, precision:0, color:dtc.tick, font:{size:10}}, grid:{color:dtc.grid}, border:{display:false} },
        y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}} }
      }
    }
  });

  // --- PARETO DEFEITOS ---
  var ofens = [
    {nome:'Parametrização', qtd:dados.filter(function(r){ return (r[COL.conforme] && r[COL.conforme]!=='N/A'); }).length},
    {nome:'Rolo Teflon',     qtd:dados.filter(function(r){ return r[COL.teflonBarra]==='Sim'; }).length},
    {nome:'Teflon Selagem',  qtd:dados.filter(function(r){ return r[COL.teflonSeladora]==='Sim'; }).length},
    {nome:'Sensor',          qtd:dados.filter(function(r){ return r[COL.sensor]==='Não'; }).length},
    {nome:'Funcionamento',   qtd:dados.filter(function(r){ return r[COL.funcionamento]==='Não'; }).length},
    {nome:'Impressão',       qtd:dados.filter(function(r){ return r[COL.impressao]==='Não'; }).length}
  ].sort(function(a,b){ return b.qtd-a.qtd; });

  if(dPareto) dPareto.destroy();
  var ctxPar = document.getElementById('d-pareto');
  if(ctxPar) dPareto = new Chart(ctxPar.getContext('2d'),{
    type:'bar',
    data:{ labels:ofens.map(function(o){ return o.nome; }), datasets:[{
      data:ofens.map(function(o){ return o.qtd; }),
      backgroundColor:['#ff4d4d','#ff7733','#ff9933','#3b82f6'],
      borderRadius:6, borderWidth:0
    }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false},
        tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8 }
      },
      scales:{
        y:{ beginAtZero:true, ticks:{maxTicksLimit:4, precision:0, color:dtc.tick, font:{size:10}}, grid:{color:dtc.grid}, border:{display:false} },
        x:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}} }
      }
    }
  });

  // --- PARÂMETROS COM MAIS ERROS ---
  var paramCount = {};
  dados.forEach(function(r){
    if((r[COL.conforme] && r[COL.conforme]!=='N/A')){
      String(r[COL.conforme]).split(',').forEach(function(s){
        var n = _normParam(s);
        if(n){ if(!paramCount[n]) paramCount[n]=0; paramCount[n]++; }
      });
    }
  });
  var paramList = Object.keys(paramCount).map(function(k){ return{nome:k,qtd:paramCount[k]}; })
    .sort(function(a,b){ return b.qtd-a.qtd; }).slice(0,10);

  if(dParams) dParams.destroy();
  var ctxParams = document.getElementById('d-params');
  var pieColors = ['#ff4d4d','#ff7733','#ff9933','#3b82f6','#a855f7','#10b981','#f59e0b','#6366f1','#ec4899','#14b8a6'];
  if(ctxParams && paramList.length>0) dParams = new Chart(ctxParams.getContext('2d'),{
    type:'doughnut',
    data:{ labels:paramList.map(function(p){ return p.nome; }), datasets:[{
      data:paramList.map(function(p){ return p.qtd; }),
      backgroundColor: paramList.map(function(p,i){ return pieColors[i]||'#aaa'; }),
      borderWidth:2, borderColor: dtc.dark?'#111':'#fff'
    }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
      plugins:{
        legend:{ position:'right', labels:{ color:dtc.tooltipTxt, font:{size:11}, boxWidth:12, padding:10 } },
        tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
          callbacks:{ label:function(c){ return ' '+c.label+': '+c.formattedValue+' ocorrências'; } }
        }
      }
    }
  });

  // (gráficos extras movidos para renderAnalise())
}

var FILTRO_AN_LINE = 'todos';

window.setFiltroAnLine = function(line, btn) {
  FILTRO_AN_LINE = line;
  document.querySelectorAll('#page-analise .f-btn[id^="an-line-"]').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  renderAnalise();
};

function filtrarAnalise() {
  var dados = filtrarDesemp();
  if (FILTRO_AN_LINE === 'todos') return dados;
  return dados.filter(function(r){
    return String(r[COL.maquina]||'').toUpperCase().indexOf(FILTRO_AN_LINE) !== -1;
  });
}

function renderAnalise() {
  var dados = filtrarAnalise();
  var dtc = getChartColors();

  // --- CONFORMIDADE — TENDÊNCIA ---
  var allDayMap = {};
  DADOS.forEach(function(r){
    var d=window.parseData(r); if(!d||isNaN(d)) return;
    var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(!allDayMap[k]) allDayMap[k]={soma:0,qtd:0};
    var ok=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
    if(r[COL.teflonBarra]==='Não')    ok++;
    if(r[COL.teflonSeladora]==='Não') ok++;
    if(r[COL.sensor]==='Sim')         ok++;
    if(r[COL.funcionamento]==='Sim')  ok++;
    if(r[COL.impressao]==='Sim')      ok++;
    allDayMap[k].soma+=(ok/6)*100; allDayMap[k].qtd++;
  });
  var sortedKeys=Object.keys(allDayMap).sort();
  var evolLabels=sortedKeys.map(function(k){ var p=k.split('-'); return p[2]+'/'+p[1]; });
  var evolData=sortedKeys.map(function(k){ return Math.round(allDayMap[k].soma/allDayMap[k].qtd); });
  var lastVal=evolData.length?evolData[evolData.length-1]:null;
  var prevVal=evolData.length>1?evolData[evolData.length-2]:null;
  var valEl=document.getElementById('an-evol-val');
  var badgeEl=document.getElementById('an-evol-badge');
  if(valEl) valEl.textContent=lastVal!==null?lastVal+'%':'—';
  if(badgeEl&&lastVal!==null&&prevVal!==null){
    var diff=lastVal-prevVal;
    if(diff>0){badgeEl.textContent='▲ +'+diff+'% vs dia anterior';badgeEl.className='pm-evolution-badge up';}
    else if(diff<0){badgeEl.textContent='▼ '+diff+'% vs dia anterior';badgeEl.className='pm-evolution-badge down';}
    else{badgeEl.textContent='= estável';badgeEl.className='pm-evolution-badge flat';}
  }
  if(anConformidade) anConformidade.destroy();
  var ctxAC=document.getElementById('an-conformidade');
  if(ctxAC) anConformidade=new Chart(ctxAC.getContext('2d'),{
    type:'line',
    data:{labels:evolLabels,datasets:[{data:evolData,borderColor:'#3b82f6',borderWidth:1.5,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:'#3b82f6',fill:true,tension:0.35,
      backgroundColor:function(ctx){var chart=ctx.chart,ca=chart.chartArea,c=chart.ctx;if(!ca) return 'transparent';var g=c.createLinearGradient(0,ca.top,0,ca.bottom);g.addColorStop(0,dtc.dark?'rgba(59,130,246,0.25)':'rgba(59,130,246,0.12)');g.addColorStop(1,'rgba(59,130,246,0)');return g;}
    }]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{display:false},tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return ' '+c.formattedValue+'%';}}}},
      scales:{y:{min:0,max:100,grid:{color:dtc.grid},border:{display:false},ticks:{callback:function(v){return v+'%';},color:dtc.tick,font:{size:10},maxTicksLimit:5}},x:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:10},maxTicksLimit:8,maxRotation:0}}}
    }
  });

  // --- PMs COM MAIS PROBLEMAS ---
  var pmDados=PMS.map(function(pm){ return window.calcPM(dados,pm); }).filter(Boolean);
  var pmProb=pmDados.map(function(p){ return{pm:p.pm.split(' ')[0],tot:p.nc+p.teflonBarra+p.teflonSeladora+p.sensor+p.funcionamento+p.impressao}; })
    .filter(function(p){ return p.tot>0; }).sort(function(a,b){ return b.tot-a.tot; });
  if(anProblemas) anProblemas.destroy();
  var ctxAP=document.getElementById('an-problemas');
  if(ctxAP&&pmProb.length>0) anProblemas=new Chart(ctxAP.getContext('2d'),{
    type:'bar',
    data:{labels:pmProb.map(function(p){return p.pm;}),datasets:[{data:pmProb.map(function(p){return p.tot;}),
      backgroundColor:pmProb.map(function(p,i){return i===0?'#ff4d4d':i<=2?'#ff7733':i<=4?'#ff9933':'#3b82f6';}),borderRadius:6,borderWidth:0}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:dtc.tooltip,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return ' '+c.formattedValue+' problemas';}}}},
      scales:{x:{beginAtZero:true,ticks:{maxTicksLimit:4,precision:0,color:dtc.tick,font:{size:10}},grid:{color:dtc.grid},border:{display:false}},y:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:10}}}}
    }
  });

  // --- PARETO DEFEITOS ---
  var ofens=[
    {nome:'Parametrização',qtd:dados.filter(function(r){return (r[COL.conforme] && r[COL.conforme]!=='N/A');}).length},
    {nome:'Rolo Teflon',   qtd:dados.filter(function(r){return r[COL.teflonBarra]==='Sim';}).length},
    {nome:'Teflon Selagem',qtd:dados.filter(function(r){return r[COL.teflonSeladora]==='Sim';}).length},
    {nome:'Sensor',        qtd:dados.filter(function(r){return r[COL.sensor]==='Não';}).length},
    {nome:'Funcionamento', qtd:dados.filter(function(r){return r[COL.funcionamento]==='Não';}).length},
    {nome:'Impressão',     qtd:dados.filter(function(r){return r[COL.impressao]==='Não';}).length}
  ].filter(function(o){return o.qtd>0;}).sort(function(a,b){return b.qtd-a.qtd;});
  if(anPareto) anPareto.destroy();
  var ctxAPar=document.getElementById('an-pareto');
  var paretoColors=['#ff4d4d','#ff7733','#ff9933','#3b82f6','#a855f7','#10b981'];
  if(ctxAPar&&ofens.length>0) anPareto=new Chart(ctxAPar.getContext('2d'),{
    type:'bar',
    data:{labels:ofens.map(function(o){return o.nome;}),datasets:[{data:ofens.map(function(o){return o.qtd;}),
      backgroundColor:ofens.map(function(o,i){return paretoColors[i]||'#aaa';}),borderRadius:6,borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:dtc.tooltip,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return ' '+c.formattedValue+' ocorrências';}}}},
      scales:{y:{beginAtZero:true,ticks:{maxTicksLimit:4,precision:0,color:dtc.tick,font:{size:10}},grid:{color:dtc.grid},border:{display:false}},x:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:10}}}}
    }
  });

  // --- PARÂMETROS ---
  var paramCount={};
  dados.forEach(function(r){ if((r[COL.conforme] && r[COL.conforme]!=='N/A')){ String(r[COL.conforme]).split(',').forEach(function(s){ var n=_normParam(s); if(n){if(!paramCount[n])paramCount[n]=0;paramCount[n]++;} }); } });
  var paramList=Object.keys(paramCount).map(function(k){return{nome:k,qtd:paramCount[k]};}).sort(function(a,b){return b.qtd-a.qtd;}).slice(0,10);
  if(anParams) anParams.destroy();
  var ctxAPrm=document.getElementById('an-params');
  var pieColors=['#ff4d4d','#ff7733','#ff9933','#3b82f6','#a855f7','#10b981','#f59e0b','#6366f1','#ec4899','#14b8a6'];
  if(ctxAPrm&&paramList.length>0) anParams=new Chart(ctxAPrm.getContext('2d'),{
    type:'doughnut',
    data:{labels:paramList.map(function(p){return p.nome;}),datasets:[{data:paramList.map(function(p){return p.qtd;}),
      backgroundColor:paramList.map(function(p,i){return pieColors[i]||'#aaa';}),borderWidth:2,borderColor:dtc.dark?'#111':'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',
      plugins:{legend:{position:'right',labels:{color:dtc.tooltipTxt,font:{size:11},boxWidth:12,padding:10}},
        tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return ' '+c.label+': '+c.formattedValue+'x';}}}}
    }
  });

  // --- PROBLEMAS POR TURNO ---
  var turnoNomesA=['T1A','T1B','T2A','T2B'];
  var turnoStatsA={};
  turnoNomesA.forEach(function(t){turnoStatsA[t]={Início:{p:0,n:0},Final:{p:0,n:0}};});
  dados.forEach(function(r){
    var t = String(r[COL.turnoCode]||'').trim();
    var periodo = String(r[COL.turno]||'').toLowerCase();
    var m = periodo.indexOf('início')>-1||periodo.indexOf('inicio')>-1 ? 'Início' : periodo.indexOf('final')>-1 ? 'Final' : null;
    if(!t||!m||!turnoStatsA[t]||!turnoStatsA[t][m]) return;
    turnoStatsA[t][m].n++;
    var temErro = (r[COL.conforme]&&r[COL.conforme]!=='N/A')||r[COL.teflonBarra]==='Sim'||r[COL.teflonSeladora]==='Sim'||r[COL.sensor]==='Não'||r[COL.funcionamento]==='Não'||r[COL.impressao]==='Não';
    if(temErro) turnoStatsA[t][m].p++;
  });
  var turnoAtivosA=turnoNomesA.filter(function(t){return turnoStatsA[t].Início.n>0||turnoStatsA[t].Final.n>0;});
  function pctA(t,m){var s=turnoStatsA[t][m];return s.n>0?Math.round((s.p/s.n)*100):0;}
  if(anTurnos) anTurnos.destroy();
  var ctxAT=document.getElementById('an-turnos');
  if(ctxAT) anTurnos=new Chart(ctxAT.getContext('2d'),{
    type:'bar',
    data:{labels:turnoAtivosA,datasets:[
      {label:'Início',data:turnoAtivosA.map(function(t){return pctA(t,'Início');}),backgroundColor:'#3b82f6',borderRadius:4,borderWidth:0},
      {label:'Final', data:turnoAtivosA.map(function(t){return pctA(t,'Final');}), backgroundColor:'#f59e0b',borderRadius:4,borderWidth:0}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:dtc.tooltipTxt,font:{size:11}}},
        tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,
          callbacks:{label:function(c){var t=turnoAtivosA[c.dataIndex];var m=c.dataset.label;var s=turnoStatsA[t][m];return ' '+m+': '+c.formattedValue+'% ('+s.p+'/'+s.n+' insp.)';}}}},
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:function(v){return v+'%';},color:dtc.tick,font:{size:10},maxTicksLimit:5},grid:{color:dtc.grid},border:{display:false}},
              x:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:11}}}}
    }
  });

  // --- IMPRESSÃO POR PM ---
  var turnoMaqsA=['PM01','PM02','PM03','PM05','PM07','PM08','PM09','PM10','PM11','PM12','PM13','PM14'];
  var impMapA={};
  turnoMaqsA.forEach(function(m){impMapA[m]={falhas:0,total:0};});
  dados.forEach(function(r){
    var m=String(r[COL.maquina]||'').split(' ')[0];
    if(!impMapA[m]) return;
    impMapA[m].total++;
    if(r[COL.impressao]==='Não') impMapA[m].falhas++;
  });
  var impLabelsA=turnoMaqsA.filter(function(m){return impMapA[m].total>0;});
  var impValsA=impLabelsA.map(function(m){
    var d=impMapA[m]; return d.total>0?Math.round(((d.total-d.falhas)/d.total)*100):0;
  });
  if(anImpressao) anImpressao.destroy();
  var ctxAI=document.getElementById('an-impressao');
  if(ctxAI&&impLabelsA.length>0) anImpressao=new Chart(ctxAI.getContext('2d'),{
    type:'bar',
    data:{labels:impLabelsA,datasets:[{label:'Conformidade (%)',data:impValsA,
      backgroundColor:impValsA.map(function(v){return v>=90?'#10b981':v>=70?'#f59e0b':'#ff4d4d';}),borderRadius:5,borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},
        tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,
          callbacks:{label:function(c){var m=impLabelsA[c.dataIndex];var d=impMapA[m];var ok=d.total-d.falhas;return ' '+c.formattedValue+'% OK ('+ok+' OK / '+d.total+' insp. · '+d.falhas+' erro(s))';}}}},
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:function(v){return v+'%';},color:dtc.tick,font:{size:10},maxTicksLimit:5},grid:{color:dtc.grid},border:{display:false}},
              x:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:10}}}}
    }
  });

  // --- CHECK DE ITENS ---
  var checkNomesA=['Tubo de sopro do ar','Bandeja de apoio do pacote','Trava da bobina de flyer','Vazamentos de ar','Proteções da máquina','Proteções da impressora','Parafusos de fixação','Roletes de impressão e puxada do flyer'];
  var checkCountA={};
  checkNomesA.forEach(function(n){checkCountA[n]=0;});
  dados.forEach(function(r){
    var val=r[COL.checkItens]; if(!val) return;
    String(val).split(',').forEach(function(s){ s=s.trim(); if(checkCountA[s]!==undefined) checkCountA[s]++; });
  });
  var checkValsA=checkNomesA.map(function(n){return checkCountA[n]||0;});
  if(anCheckItens) anCheckItens.destroy();
  var ctxACh=document.getElementById('an-check-itens');
  if(ctxACh) anCheckItens=new Chart(ctxACh.getContext('2d'),{
    type:'bar',
    data:{labels:checkNomesA,datasets:[{label:'Ocorrências',data:checkValsA,
      backgroundColor:checkValsA.map(function(v){return v>=5?'#ff4d4d':v>=2?'#f59e0b':'#10b981';}),borderRadius:4,borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      plugins:{legend:{display:false},
        tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return ' '+c.formattedValue+' ocorrência(s)';}}}}
      ,scales:{x:{beginAtZero:true,ticks:{maxTicksLimit:5,precision:0,color:dtc.tick,font:{size:10}},grid:{color:dtc.grid},border:{display:false}},
               y:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:11}}}}
    }
  });

  // --- PARADAS POR PM ---
  if (window._dParadas) window._dParadas.destroy();
  var dParadasEl = document.getElementById('d-paradas');
  if (dParadasEl) {
    var paradasPM = PMS.map(function(pm){
      var qtd = dados.filter(function(r){
        var _m = String(r[COL.maquina]||'').trim();
        return (_m===pm || _m.replace(/\s.*$/,'').toLowerCase()===pm.replace(/\s.*$/,'').toLowerCase()) && r[COL.funcionamento]==='Não';
      }).length;
      return { pm: pm.split(' ')[0], qtd: qtd };
    }).filter(function(x){ return x.qtd > 0; }).sort(function(a,b){ return b.qtd-a.qtd; });
    if (paradasPM.length > 0) {
      var barColsP = paradasPM.map(function(x,i){ return i===0?'#cc2200':i<=2?'#ff5533':'#ff8855'; });
      window._dParadas = new Chart(dParadasEl.getContext('2d'),{
        type:'bar',
        data:{ labels:paradasPM.map(function(x){ return x.pm; }), datasets:[{
          data:paradasPM.map(function(x){ return x.qtd; }),
          backgroundColor:barColsP, borderRadius:6, borderWidth:0
        }]},
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
            callbacks:{ label:function(c){ return ' '+c.formattedValue+' parada(s)'; } } } },
          scales:{
            x:{ beginAtZero:true, ticks:{precision:0, color:dtc.tick, font:{size:11}, maxTicksLimit:5}, grid:{color:dtc.grid}, border:{display:false} },
            y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:11}} }
          }
        }
      });
    }
  }
}


function splitParams(val) {
  if (!val) return [];
  return String(val).split(',').map(function(s){ return s.trim(); }).filter(function(s){ return s !== ''; });
}

// --- MODAL DETALHES DESEMPENHO ---
var _desempDetailChart = null;

window.openDesempModal = function(type) {
  var modal = document.getElementById('desemp-detail-modal');
  if (!modal) return;
  var dados = filtrarAnalise();
  var dtc = getChartColors();

  var titles = { conformidade:'Conformidade Geral', pms:'PMs com Mais Problemas', pareto:'Tipos de Defeito (Pareto)', params:'Parâmetros com Mais Erros', paradas:'Histórico de Paradas', turnos:'Problemas por Turno', impressao:'Impressão da Etiqueta por PM', checkitens:'Check de Itens Irregulares' };
  document.getElementById('desemp-detail-title').textContent = titles[type] || 'Detalhes';

  var kpisEl = document.getElementById('desemp-detail-kpis');
  var listEl = document.getElementById('desemp-detail-list');
  kpisEl.innerHTML = '';
  listEl.innerHTML = '';
  listEl.style.display = 'none';

  if (_desempDetailChart) { _desempDetailChart.destroy(); _desempDetailChart = null; }
  var ctx = document.getElementById('desemp-detail-chart');

  function mkKpi(label, val, sub, color) {
    return '<div style="background:rgba(0,0,0,0.03);border-radius:10px;padding:12px 14px;border:1px solid rgba(0,0,0,0.06);">'
      +'<div style="font-size:11px;color:#888;margin-bottom:4px;">'+label+'</div>'
      +'<div style="font-size:20px;font-weight:700;color:'+(color||'inherit')+';">'+val+'</div>'
      +(sub?'<div style="font-size:11px;color:#aaa;margin-top:2px;">'+sub+'</div>':'')
      +'</div>';
  }

  if (type === 'conformidade') {
    // Build daily history from ALL data
    var allDayMap = {};
    DADOS.forEach(function(r) {
      var d = window.parseData(r); if (!d || isNaN(d)) return;
      var k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      if (!allDayMap[k]) allDayMap[k] = { soma:0, qtd:0 };
      var ok=0;
      if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
      if(r[COL.teflonBarra]==='Não')    ok++;
      if(r[COL.teflonSeladora]==='Não') ok++;
      if(r[COL.sensor]==='Sim')         ok++;
      if(r[COL.funcionamento]==='Sim')  ok++;
      if(r[COL.impressao]==='Sim')      ok++;
      allDayMap[k].soma += (ok/6)*100; allDayMap[k].qtd++;
    });
    var sortedKeys = Object.keys(allDayMap).sort();
    var evolLabels = sortedKeys.map(function(k){ var p=k.split('-'); return p[2]+'/'+p[1]; });
    var evolData   = sortedKeys.map(function(k){ return Math.round(allDayMap[k].soma/allDayMap[k].qtd); });

    var last = evolData.length ? evolData[evolData.length-1] : null;
    var prev = evolData.length>1 ? evolData[evolData.length-2] : null;
    var avg  = evolData.length ? Math.round(evolData.reduce(function(a,b){return a+b;},0)/evolData.length) : null;
    var minV = evolData.length ? Math.min.apply(null,evolData) : null;
    var maxV = evolData.length ? Math.max.apply(null,evolData) : null;
    var trend = (last !== null && prev !== null) ? (last-prev > 0 ? '▲ +' : last-prev < 0 ? '▼ ' : '= ') + Math.abs(last-prev) + '% vs ontem' : '—';
    var col = last !== null ? (last >= 70 ? '#22c55e' : last >= 50 ? '#f59e0b' : '#ef4444') : 'inherit';

    kpisEl.innerHTML =
      mkKpi('Conformidade Atual', last !== null ? last+'%' : '—', trend, col) +
      mkKpi('Média Histórica', avg !== null ? avg+'%' : '—', 'todos os dias', null) +
      mkKpi('Faixa', minV !== null ? minV+'% – '+maxV+'%' : '—', 'mínimo – máximo', null);

    _desempDetailChart = new Chart(ctx.getContext('2d'), {
      type:'line',
      data:{ labels:evolLabels, datasets:[{
        label:'Conformidade %',
        data:evolData, borderColor:'#3b82f6', borderWidth:1.5,
        pointRadius:2, pointHoverRadius:5, pointBackgroundColor:'#3b82f6',
        fill:true, tension:0.35,
        backgroundColor: function(c){ var ch=c.chart,ca=ch.chartArea,cx=ch.ctx; if(!ca) return 'transparent'; var g=cx.createLinearGradient(0,ca.top,0,ca.bottom); g.addColorStop(0,'rgba(59,130,246,0.20)'); g.addColorStop(1,'rgba(59,130,246,0)'); return g; }
      }]},
      options:{ responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8, padding:10, callbacks:{ label:function(c){ return ' '+c.formattedValue+'%'; } } } },
        scales:{
          y:{ min:0, max:100, grid:{color:dtc.grid}, border:{display:false}, ticks:{callback:function(v){return v+'%';}, color:dtc.tick, font:{size:11}, maxTicksLimit:6} },
          x:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}, maxTicksLimit:10, maxRotation:0} }
        }
      }
    });


  } else if (type === 'pms') {
    var pmDados = PMS.map(function(pm){ return window.calcPM(dados, pm); }).filter(Boolean);
    var pmProb = pmDados.map(function(p){ return { pm:p.pm, tot:p.nc+p.teflonBarra+p.teflonSeladora+p.sensor, nc:p.nc, tb:p.teflonBarra, ts:p.teflonSeladora, sen:p.sensor }; })
      .sort(function(a,b){ return b.tot-a.tot; });

    var worst = pmProb[0];
    var total = pmProb.reduce(function(s,p){return s+p.tot;},0);
    var withProbs = pmProb.filter(function(p){return p.tot>0;}).length;

    kpisEl.innerHTML =
      mkKpi('PM Mais Crítica', worst ? worst.pm.split(' ')[0] : '—', worst ? worst.tot+' erros no período' : '', '#ef4444') +
      mkKpi('Total de Erros', total, 'no período filtrado', null) +
      mkKpi('PMs com Erros', withProbs+'/'+PMS.length, 'máquinas com problema', withProbs > PMS.length/2 ? '#f59e0b' : null);

    var barColors = pmProb.map(function(p,i){ return i===0?'#ef4444':i<=2?'#f97316':i<=4?'#f59e0b':'#3b82f6'; });
    _desempDetailChart = new Chart(ctx.getContext('2d'), {
      type:'bar',
      data:{ labels:pmProb.map(function(p){ return p.pm.split(' ')[0]; }), datasets:[{
        label:'Erros', data:pmProb.map(function(p){ return p.tot; }),
        backgroundColor:barColors, borderRadius:6, borderWidth:0
      }]},
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
          callbacks:{ label:function(c){ return ' '+c.formattedValue+' erros'; } } } },
        scales:{
          x:{ beginAtZero:true, ticks:{precision:0, color:dtc.tick, font:{size:11}, maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} },
          y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:11}} }
        }
      }
    });


  } else if (type === 'pareto') {
    var ofens = [
      {nome:'Parametrização', qtd:dados.filter(function(r){ return (r[COL.conforme] && r[COL.conforme]!=='N/A'); }).length},
      {nome:'Teflon Barra',   qtd:dados.filter(function(r){ return r[COL.teflonBarra]==='Sim'; }).length},
      {nome:'Teflon Seladora',qtd:dados.filter(function(r){ return r[COL.teflonSeladora]==='Sim'; }).length},
      {nome:'Sensor',         qtd:dados.filter(function(r){ return r[COL.sensor]==='Não'; }).length}
    ].sort(function(a,b){ return b.qtd-a.qtd; });
    var totalDef = ofens.reduce(function(s,o){return s+o.qtd;},0);

    // Cumulative % for pareto line
    var cumul = [], acc = 0;
    ofens.forEach(function(o){ acc += o.qtd; cumul.push(totalDef ? Math.round(acc/totalDef*100) : 0); });

    kpisEl.innerHTML =
      mkKpi('Principal Defeito', ofens[0] ? ofens[0].nome : '—', ofens[0] ? ofens[0].qtd+' ocorrências' : '', '#ef4444') +
      mkKpi('Total de Defeitos', totalDef, 'no período filtrado', null) +
      mkKpi('80% dos Defeitos', ofens.filter(function(o,i){ return cumul[i]<=80; }).length+1+' tipo(s)', 'regra de pareto', null);

    _desempDetailChart = new Chart(ctx.getContext('2d'), {
      type:'bar',
      data:{ labels:ofens.map(function(o){return o.nome;}), datasets:[
        { type:'bar', label:'Ocorrências', data:ofens.map(function(o){return o.qtd;}),
          backgroundColor:['#ef4444','#f97316','#f59e0b','#3b82f6'], borderRadius:6, borderWidth:0, yAxisID:'y' },
        { type:'line', label:'Acumulado %', data:cumul, borderColor:'#6366f1', borderWidth:2,
          pointRadius:4, pointBackgroundColor:'#6366f1', fill:false, tension:0, yAxisID:'y2' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ color:dtc.tooltipTxt, font:{size:11}, boxWidth:12 } },
          tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8 } },
        scales:{
          y:{ beginAtZero:true, ticks:{precision:0, color:dtc.tick, font:{size:11}}, grid:{color:dtc.grid}, border:{display:false} },
          y2:{ position:'right', min:0, max:100, ticks:{callback:function(v){return v+'%';}, color:dtc.tick, font:{size:11}}, grid:{display:false}, border:{display:false} },
          x:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:11}} }
        }
      }
    });


  } else if (type === 'params') {
    var paramCount = {};
    dados.forEach(function(r){
      if((r[COL.conforme] && r[COL.conforme]!=='N/A')){
        splitParams(r[COL.detalheParametro]).forEach(function(p){ if(!paramCount[p]) paramCount[p]=0; paramCount[p]++; });
      }
    });
    var paramList = Object.keys(paramCount).map(function(k){ return{nome:k,qtd:paramCount[k]}; })
      .sort(function(a,b){ return b.qtd-a.qtd; });
    var totalP = paramList.reduce(function(s,p){return s+p.qtd;},0);
    var pieColors = ['#ef4444','#f97316','#f59e0b','#3b82f6','#a855f7','#10b981','#f59e0b','#6366f1','#ec4899','#14b8a6'];

    kpisEl.innerHTML =
      mkKpi('Parâmetro Mais Crítico', paramList[0] ? paramList[0].nome : '—', paramList[0] ? paramList[0].qtd+' erros' : 'sem dados', '#ef4444') +
      mkKpi('Total de Erros', totalP, 'por parâmetro no período', null) +
      mkKpi('Parâmetros Únicos', paramList.length, 'com pelo menos 1 erro', null);

    if (paramList.length > 0) {
      _desempDetailChart = new Chart(ctx.getContext('2d'), {
        type:'bar',
        data:{ labels:paramList.map(function(p){ return p.nome; }), datasets:[{
          label:'Erros', data:paramList.map(function(p){ return p.qtd; }),
          backgroundColor: paramList.map(function(p,i){ return pieColors[i]||'#aaa'; }),
          borderRadius:6, borderWidth:0
        }]},
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
            callbacks:{ label:function(c){ return ' '+c.formattedValue+' erros'; } } } },
          scales:{
            x:{ beginAtZero:true, ticks:{precision:0, color:dtc.tick, font:{size:11}, maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} },
            y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}} }
          }
        }
      });
    }

  } else if (type === 'paradas') {
    var paradasDetalhe = PMS.map(function(pm) {
      var rows = dados.filter(function(r){
        var _m = String(r[COL.maquina]||'').trim();
        return (_m===pm || _m.replace(/\s.*$/,'').toLowerCase()===pm.replace(/\s.*$/,'').toLowerCase()) && r[COL.funcionamento]==='Não';
      });
      return { pm: pm, qtd: rows.length, rows: rows };
    }).filter(function(x){ return x.qtd > 0; }).sort(function(a,b){ return b.qtd-a.qtd; });

    var totalParadas = paradasDetalhe.reduce(function(s,x){ return s+x.qtd; }, 0);
    var pmMaisParada = paradasDetalhe[0];
    var turnoMap = {};
    dados.forEach(function(r){
      if (r[COL.funcionamento]==='Não'){
        var t = String(r[COL.turnoCode]||r[COL.turno]||'').trim();
        if (t){ if(!turnoMap[t]) turnoMap[t]=0; turnoMap[t]++; }
      }
    });
    var turnoKeys = Object.keys(turnoMap).sort(function(a,b){ return turnoMap[b]-turnoMap[a]; });

    kpisEl.innerHTML =
      mkKpi('Total de Paradas', totalParadas, 'no período', totalParadas>0?'#cc2200':null) +
      mkKpi('PM Mais Afetada', pmMaisParada ? pmMaisParada.pm.split(' ')[0] : '—', pmMaisParada ? pmMaisParada.qtd+' parada(s)' : 'nenhuma', pmMaisParada?'#cc2200':null) +
      mkKpi('Turno c/ mais paradas', turnoKeys[0]||'—', turnoKeys[0]?turnoMap[turnoKeys[0]]+' ocorrências':'', null);

    var barCols2 = paradasDetalhe.map(function(x,i){ return i===0?'#cc2200':i<=2?'#ff5533':'#ff8855'; });
    if (paradasDetalhe.length > 0) {
      _desempDetailChart = new Chart(ctx.getContext('2d'), {
        type:'bar',
        data:{ labels:paradasDetalhe.map(function(x){ return x.pm.split(' ')[0]; }), datasets:[{
          label:'Paradas', data:paradasDetalhe.map(function(x){ return x.qtd; }),
          backgroundColor:barCols2, borderRadius:8, borderWidth:0
        }]},
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
            callbacks:{ label:function(c){ return ' '+c.formattedValue+' parada(s)'; } } } },
          scales:{
            x:{ beginAtZero:true, ticks:{precision:0, color:dtc.tick, font:{size:12}, maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} },
            y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:12}} }
          }
        }
      });
    }

    // Lista detalhada por PM
    if (paradasDetalhe.length > 0) {
      listEl.style.display = 'block';
      listEl.innerHTML = paradasDetalhe.map(function(x) {
        var ultimas = x.rows.slice().sort(function(a,b){ return window.parseData(b)-window.parseData(a); }).slice(0,3);
        var linhas = ultimas.map(function(r){
          var d = window.parseData(r);
          var ds = d ? d.toLocaleDateString('pt-BR')+' · '+r[COL.turno] : '—';
          var obs = r[COL.obsFuncionamento] ? ' — '+r[COL.obsFuncionamento] : '';
          return '<div style="font-size:12px;color:#aaa;padding:3px 0;">🔴 '+ds+obs+'</div>';
        }).join('');
        return '<div style="padding:12px 16px;border-bottom:1px solid rgba(128,128,128,0.1);">'
          + '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">'+x.pm.split(' ')[0]
          + ' <span style="font-size:11px;font-weight:400;color:#aaa;">'+x.pm.split(' - ')[1]+'</span>'
          + ' <span style="font-size:12px;font-weight:700;color:#cc2200;margin-left:8px;">'+x.qtd+'×</span></div>'
          + linhas
          + '</div>';
      }).join('');
    }

  } else if (type === 'turnos') {
    var turnoErros = {};
    dados.forEach(function(r){
      var t = String(r[COL.turno]||'').trim(); if (!t) return;
      if (!turnoErros[t]) turnoErros[t] = { nc:0, tb:0, ts:0, sen:0, func:0, imp:0, total:0 };
      turnoErros[t].total++;
      if (r[COL.conforme] && r[COL.conforme]!=='N/A') turnoErros[t].nc++;
      if (r[COL.teflonBarra]==='Sim')    turnoErros[t].tb++;
      if (r[COL.teflonSeladora]==='Sim') turnoErros[t].ts++;
      if (r[COL.sensor]==='Não')         turnoErros[t].sen++;
      if (r[COL.funcionamento]==='Não')  turnoErros[t].func++;
      if (r[COL.impressao]==='Não')      turnoErros[t].imp++;
    });
    var turnos = Object.keys(turnoErros).sort();
    var totalT = turnos.reduce(function(s,t){ var e=turnoErros[t]; return s+e.nc+e.tb+e.ts+e.sen+e.func+e.imp; }, 0);
    var piorT = turnos.sort(function(a,b){ var ea=turnoErros[a], eb=turnoErros[b]; return (eb.nc+eb.tb+eb.ts+eb.sen+eb.func+eb.imp)-(ea.nc+ea.tb+ea.ts+ea.sen+ea.func+ea.imp); })[0];
    kpisEl.innerHTML =
      mkKpi('Turnos analisados', turnos.length, 'no período', null) +
      mkKpi('Total de erros', totalT, 'todos os turnos', totalT>0?'#ef4444':null) +
      mkKpi('Turno c/ mais erros', piorT||'—', piorT?((turnoErros[piorT].nc+turnoErros[piorT].tb+turnoErros[piorT].ts+turnoErros[piorT].sen+turnoErros[piorT].func+turnoErros[piorT].imp)+' erros'):'', piorT?'#f97316':null);
    var cats = ['Param. NC','Teflon B.','Teflon S.','Sensor','Parada','Impressão'];
    var turnosSort = Object.keys(turnoErros).sort();
    _desempDetailChart = new Chart(ctx.getContext('2d'),{
      type:'bar',
      data:{ labels:turnosSort, datasets:[
        { label:'Param. NC',   data:turnosSort.map(function(t){ return turnoErros[t].nc; }),   backgroundColor:'#ef4444', borderRadius:4, borderWidth:0 },
        { label:'Teflon Barra',data:turnosSort.map(function(t){ return turnoErros[t].tb; }),   backgroundColor:'#f97316', borderRadius:4, borderWidth:0 },
        { label:'Teflon Sel.', data:turnosSort.map(function(t){ return turnoErros[t].ts; }),   backgroundColor:'#f59e0b', borderRadius:4, borderWidth:0 },
        { label:'Sensor',      data:turnosSort.map(function(t){ return turnoErros[t].sen; }),  backgroundColor:'#3b82f6', borderRadius:4, borderWidth:0 },
        { label:'Parada',      data:turnosSort.map(function(t){ return turnoErros[t].func; }), backgroundColor:'#cc2200', borderRadius:4, borderWidth:0 },
        { label:'Impressão',   data:turnosSort.map(function(t){ return turnoErros[t].imp; }),  backgroundColor:'#a855f7', borderRadius:4, borderWidth:0 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, labels:{ color:dtc.tooltipTxt, font:{size:11}, boxWidth:12, padding:10 } },
          tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
            callbacks:{ label:function(c){ return ' '+c.dataset.label+': '+c.formattedValue; } } } },
        scales:{
          x:{ stacked:true, grid:{color:dtc.grid}, border:{display:false}, ticks:{color:dtc.tick,font:{size:11}} },
          y:{ stacked:true, beginAtZero:true, ticks:{precision:0,color:dtc.tick,font:{size:11},maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} }
        }
      }
    });

  } else if (type === 'impressao') {
    var impDataModal = PMS.map(function(pm){
      var rows = dados.filter(function(r){ var _m=String(r[COL.maquina]||'').trim(); return _m===pm||_m.replace(/\s.*$/,'').toLowerCase()===pm.replace(/\s.*$/,'').toLowerCase(); });
      var falhas = rows.filter(function(r){ return r[COL.impressao]==='Não'; }).length;
      return { pm:pm.split(' ')[0], total:rows.length, falhas:falhas, conf: rows.length>0?Math.round(((rows.length-falhas)/rows.length)*100):100 };
    }).filter(function(x){ return x.total>0; }).sort(function(a,b){ return a.conf-b.conf; });
    var totalImp = impDataModal.reduce(function(s,x){ return s+x.total; },0);
    var totalFalhas = impDataModal.reduce(function(s,x){ return s+x.falhas; },0);
    var confGeral = totalImp>0?Math.round(((totalImp-totalFalhas)/totalImp)*100):100;
    kpisEl.innerHTML =
      mkKpi('Conformidade Geral', confGeral+'%', 'impressão etiqueta', confGeral>=90?'#00a650':confGeral>=70?'#f97316':'#ef4444') +
      mkKpi('Total de Falhas', totalFalhas, 'no período', totalFalhas>0?'#ef4444':null) +
      mkKpi('PMs analisadas', impDataModal.length, 'com inspeções', null);
    var barColsImp = impDataModal.map(function(x){ return x.conf>=90?'#00a650':x.conf>=70?'#f59e0b':'#ef4444'; });
    _desempDetailChart = new Chart(ctx.getContext('2d'),{
      type:'bar',
      data:{ labels:impDataModal.map(function(x){ return x.pm; }), datasets:[{
        label:'Conformidade %', data:impDataModal.map(function(x){ return x.conf; }),
        backgroundColor:barColsImp, borderRadius:6, borderWidth:0
      }]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
          callbacks:{ label:function(c){ return ' '+c.formattedValue+'% conformidade'; } } } },
        scales:{
          x:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick,font:{size:11}} },
          y:{ min:0, max:100, ticks:{callback:function(v){return v+'%';}, precision:0, color:dtc.tick, font:{size:11}, maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} }
        }
      }
    });

  } else if (type === 'checkitens') {
    var checkNomes = ['Tubo de sopro do ar','Bandeja de apoio do pacote','Trava da bobina de flyer','Vazamentos de ar','Proteções da máquina','Proteções da impressora','Parafusos de fixação','Roletes de impressão e puxada do flyer'];
    var checkCount = {}; checkNomes.forEach(function(n){ checkCount[n]=0; });
    dados.forEach(function(r){
      var val=r[COL.checkItens]; if(!val) return;
      String(val).split(',').forEach(function(s){ s=s.trim(); if(checkCount[s]!==undefined) checkCount[s]++; });
    });
    var checkList = checkNomes.map(function(n){ return{nome:n,qtd:checkCount[n]}; }).filter(function(x){ return x.qtd>0; }).sort(function(a,b){ return b.qtd-a.qtd; });
    var totalCh = checkList.reduce(function(s,x){ return s+x.qtd; },0);
    kpisEl.innerHTML =
      mkKpi('Total de Irregularidades', totalCh, 'no período', totalCh>0?'#f97316':null) +
      mkKpi('Item Mais Crítico', checkList[0]?checkList[0].nome.split(' ').slice(0,2).join(' '):'—', checkList[0]?checkList[0].qtd+' ocorrências':'', checkList[0]?'#ef4444':null) +
      mkKpi('Itens com Problema', checkList.length, 'de '+checkNomes.length+' verificados', null);
    var barColsCh = checkList.map(function(x){ return x.qtd>=5?'#ef4444':x.qtd>=2?'#f59e0b':'#10b981'; });
    _desempDetailChart = new Chart(ctx.getContext('2d'),{
      type:'bar',
      data:{ labels:checkList.map(function(x){ return x.nome; }), datasets:[{
        data:checkList.map(function(x){ return x.qtd; }),
        backgroundColor:barColsCh, borderRadius:6, borderWidth:0
      }]},
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:dtc.tooltip, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
          callbacks:{ label:function(c){ return ' '+c.formattedValue+' ocorrência(s)'; } } } },
        scales:{
          x:{ beginAtZero:true, ticks:{precision:0,color:dtc.tick,font:{size:11},maxTicksLimit:6}, grid:{color:dtc.grid}, border:{display:false} },
          y:{ grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick,font:{size:11}} }
        }
      }
    });
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeDesempModal = function() {
  var modal = document.getElementById('desemp-detail-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  if (_desempDetailChart) { _desempDetailChart.destroy(); _desempDetailChart = null; }
};

// Close on overlay click
(function(){
  var m = document.getElementById('desemp-detail-modal');
  if (m) m.addEventListener('click', function(e){ if (e.target === m) window.closeDesempModal(); });
})();

window.parseData = function(row) {
  var v = row[COL.data];
  if (!v) return null;
  if (v instanceof Date) return v;
  return new Date(v);
}

function _dk(d){ return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); }

function _normParam(s) {
  s = String(s || '').trim();
  if (!s || s === 'N/A' || s.toLowerCase() === 'n/a') return null;
  if (/seal.?time|tempo.?sel/i.test(s))           return 'Seal Time';
  if (/seal.?temp|temp.*vedaç/i.test(s))          return 'Seal Temperature';
  if (/seal.?point|ponto.?vedaç/i.test(s))        return 'Seal Point';
  if (/air.?pulse|pulso.?ar/i.test(s))            return 'Air Pulse';
  if (/print.?speed|veloc.*impress/i.test(s))     return 'Print Speed';
  if (/print.?contrast|cabeça.*impress|contrast/i.test(s)) return 'Print Contrast';
  // fallback: pega só o primeiro segmento antes de "/" ou "("
  return s.split(/[\/\(]/)[0].trim().slice(0, 25) || null;
}

window.filtrarDados = function(dados) {
  var n = new Date();
  var hj = _dk(n);
  var ot = new Date(n); ot.setDate(n.getDate()-1); var otN = _dk(ot);
  return dados.filter(function(row) {
    var d = window.parseData(row);
    if (!d || isNaN(d)) return false;
    var dk = _dk(d);
    if (FILTRO==='hoje')  return dk===hj;
    if (FILTRO==='ontem') return dk===otN;
    if (FILTRO==='dia-especifico' && window._filtroDia) return dk===_dk(window._filtroDia);
    if (FILTRO==='mes-especifico' && window._filtroMes!=null) {
      return d.getFullYear()===window._filtroAno && d.getMonth()===window._filtroMes;
    }
    return true;
  });
}

function _modalKpiParada(label, val) {
  var cor = val === 0 ? '#00a650' : '#cc2200';
  return '<div style="background:rgba(0,0,0,0.03);border-radius:10px;padding:12px 14px;text-align:center;">'
    + '<div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">'+label+'</div>'
    + '<div style="font-size:24px;font-weight:800;color:'+cor+';">'+val+'</div>'
    + '</div>';
}

window.calcPM = function(dados, pm) {
  var total=0, somaScores=0, nc=0, tb=0, ts=0, sen=0, func=0, imp=0;
  var ultimaRow=null, ultimaTs=0, inicioRow=null, finalRow=null;
  for (var i=0; i<dados.length; i++) {
    var r=dados[i];
    var _maq = String(r[COL.maquina]||'').trim();
    var _pmNum = pm.replace(/\s.*$/,'').toLowerCase();
    if (_maq !== pm && _maq.replace(/\s.*$/,'').toLowerCase() !== _pmNum) continue;
    total++;
    var ok=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A'))        ok++; else nc++;
    if(r[COL.teflonBarra]==='Não')     ok++; else if(r[COL.teflonBarra]==='Sim') tb++;
    if(r[COL.teflonSeladora]==='Não')  ok++; else if(r[COL.teflonSeladora]==='Sim') ts++;
    if(r[COL.sensor]==='Sim')          ok++; else if(r[COL.sensor]==='Não') sen++;
    if(r[COL.funcionamento]==='Sim')   ok++; else if(r[COL.funcionamento]==='Não') func++;
    if(r[COL.impressao]==='Sim')       ok++; else if(r[COL.impressao]==='Não') imp++;
    somaScores += (ok/6)*100;
    var ts2 = window.parseData(r); if(ts2){ var t=ts2.getTime(); if(t>ultimaTs){ultimaTs=t;ultimaRow=r;} }
    var turno=String(r[COL.turno]||'').toLowerCase();
    if(turno.indexOf('início')>-1||turno.indexOf('inicio')>-1) inicioRow=r;
    else if(turno.indexOf('final')>-1) finalRow=r;
  }
  if (!total) return null;
  var ultimaHora='—';
  if(ultimaRow){ var dd=window.parseData(ultimaRow); if(dd) ultimaHora=dd.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
  var inicioOk = inicioRow?((!inicioRow[COL.conforme]||inicioRow[COL.conforme]==='N/A')?'Sim':'Não'):'—';
  var finalOk  = finalRow ?((!finalRow[COL.conforme] ||finalRow[COL.conforme]==='N/A') ?'Sim':'Não'):'—';
  var parada = ultimaRow ? (ultimaRow[COL.funcionamento]==='Não') : false;
  return { pm:pm, total:total, nc:nc, taxa:Math.round(somaScores/total), teflonBarra:tb, teflonSeladora:ts, sensor:sen, funcionamento:func, impressao:imp, inicio:inicioOk, final:finalOk, hora:ultimaHora, parada:parada };
}

var _renderTimer = null;
var _renderFn = function() {
  if (!DADOS.length) return;
  var dados = window.filtrarDados(DADOS);
  var mesesNome = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var labelFiltro = FILTRO==='hoje' ? 'hoje'
    : FILTRO==='ontem' ? 'ontem'
    : FILTRO==='dia-especifico' && window._filtroDia ? window._filtroDia.toLocaleDateString('pt-BR')
    : FILTRO==='mes-especifico' && window._filtroMes!=null ? mesesNome[window._filtroMes]+'/'+window._filtroAno
    : 'geral';
  var total = dados.length;
  var maqsComErroMap = {};
  dados.forEach(function(r){
    if((r[COL.conforme] && r[COL.conforme]!=='N/A')||r[COL.teflonBarra]==='Sim'||r[COL.teflonSeladora]==='Sim'||r[COL.sensor]==='Não'||r[COL.funcionamento]==='Não'||r[COL.impressao]==='Não'){
      if(!maqsComErroMap[r[COL.maquina]]) maqsComErroMap[r[COL.maquina]] = {nc:0,teflonBarra:0,teflonSeladora:0,sensor:0,funcionamento:0,impressao:0};
      if((r[COL.conforme] && r[COL.conforme]!=='N/A'))       maqsComErroMap[r[COL.maquina]].nc++;
      if(r[COL.teflonBarra]==='Sim')    maqsComErroMap[r[COL.maquina]].teflonBarra++;
      if(r[COL.teflonSeladora]==='Sim') maqsComErroMap[r[COL.maquina]].teflonSeladora++;
      if(r[COL.sensor]==='Não')         maqsComErroMap[r[COL.maquina]].sensor++;
      if(r[COL.funcionamento]==='Não')  maqsComErroMap[r[COL.maquina]].funcionamento++;
      if(r[COL.impressao]==='Não')      maqsComErroMap[r[COL.maquina]].impressao++;
    }
  });
  window._maqsComErroMap = maqsComErroMap;
  var maqErroCount = Object.keys(maqsComErroMap).length;
  var somaScoresGeral = 0;
  dados.forEach(function(r){
    var checksOk=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       checksOk++;
    if(r[COL.teflonBarra]==='Não')    checksOk++;
    if(r[COL.teflonSeladora]==='Não') checksOk++;
    if(r[COL.sensor]==='Sim')         checksOk++;
    if(r[COL.funcionamento]==='Sim')  checksOk++;
    if(r[COL.impressao]==='Sim')      checksOk++;
    somaScoresGeral+=(checksOk/6)*100;
  });
  var taxa = total>0?Math.round(somaScoresGeral/total):0;
  var pmDados = PMS.map(function(pm){ return window.calcPM(dados,pm); }).filter(Boolean);
  var piores = pmDados.filter(function(p){ return p.taxa<50; });
  var melhores = pmDados.filter(function(p){ return p.taxa>=70; });
  var piorPM = pmDados.length?pmDados.reduce(function(a,b){ return a.taxa<b.taxa?a:b; }):null;

  document.getElementById('kpi-row').innerHTML = [
    '<div class="kpi"><div class="kpi-label">Total inspeções</div><div class="kpi-val">'+total+'</div><div class="kpi-sub">'+labelFiltro+'</div></div>',
    '<div class="kpi '+(maqErroCount>0?maqErroCount>=PMS.length*0.5?'crit':'warn':'ok')+'" style="cursor:'+(maqErroCount>0?'pointer':'default')+'" onclick="'+(maqErroCount>0?'window.openMaqProblemasModal()':'')+'" title="'+(maqErroCount>0?'Ver máquinas com problemas':'')+'"><div class="kpi-label">Máqs. c/ problemas</div><div class="kpi-val">'+maqErroCount+'<span style="font-size:18px;font-weight:500;color:#bbb"> /'+PMS.length+'</span></div><div class="kpi-sub">'+(piorPM?'pior: '+piorPM.pm.split(' ')[0]:'sem ocorrências')+'</div></div>',
    '<div class="kpi '+(taxa>=70?'ok':taxa>=50?'warn':'crit')+'"><div class="kpi-label">Taxa geral média</div><div class="kpi-val">'+taxa+'%</div><div class="kpi-sub">meta: 70%</div></div>',
  ].join('');

  // --- MINI GRÁFICO 3 DIAS (card do lado dos KPIs) ---
  (function() {
    var dayMap = {};
    DADOS.forEach(function(r) {
      var d = window.parseData(r); if (!d || isNaN(d)) return;
      var k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      if (!dayMap[k]) dayMap[k] = { soma:0, qtd:0 };
      var ok=0;
      if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
      if(r[COL.teflonBarra]==='Não')    ok++;
      if(r[COL.teflonSeladora]==='Não') ok++;
      if(r[COL.sensor]==='Sim')         ok++;
      if(r[COL.funcionamento]==='Sim')  ok++;
      if(r[COL.impressao]==='Sim')      ok++;
      dayMap[k].soma += (ok/6)*100; dayMap[k].qtd++;
    });
    var keys = Object.keys(dayMap).sort();
    var miniLabels = keys.map(function(k){ var p=k.split('-'); return p[2]+'/'+p[1]; });
    var miniData   = keys.map(function(k){ return Math.round(dayMap[k].soma/dayMap[k].qtd); });

    var last = miniData.length ? miniData[miniData.length-1] : null;
    var prev = miniData.length>1 ? miniData[miniData.length-2] : null;
    document.getElementById('kpi-mini-val').textContent = last !== null ? last+'%' : '—';
    var badge = document.getElementById('kpi-mini-badge');
    if (last !== null && prev !== null) {
      var diff = last - prev;
      if (diff > 0) { badge.textContent='▲ +'+diff+'%'; badge.className='kpi-evol-mini-badge up'; }
      else if (diff < 0) { badge.textContent='▼ '+diff+'%'; badge.className='kpi-evol-mini-badge down'; }
      else { badge.textContent='= estável'; badge.className='kpi-evol-mini-badge'; }
    } else { badge.textContent=''; badge.className='kpi-evol-mini-badge'; }

    if (window._kpiMiniChart) window._kpiMiniChart.destroy();
    var ctxM = document.getElementById('kpi-mini-chart'); if (!ctxM) return;
    var tcM = getChartColors();
    window._kpiMiniChart = new Chart(ctxM.getContext('2d'), {
      type: 'line',
      data: { labels: miniLabels, datasets: [{
        data: miniData, borderColor: '#3b82f6', borderWidth: 1,
        pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: '#3b82f6',
        fill: true, tension: 0.4,
        backgroundColor: function(ctx) {
          var chart=ctx.chart, ca=chart.chartArea, c=chart.ctx;
          if (!ca) return 'transparent';
          var g=c.createLinearGradient(0,ca.top,0,ca.bottom);
          g.addColorStop(0, tcM.dark?'rgba(59,130,246,0.22)':'rgba(59,130,246,0.12)');
          g.addColorStop(1,'rgba(59,130,246,0)'); return g;
        }
      }]},
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{display:false}, tooltip:{
          backgroundColor:tcM.tooltip, bodyColor:tcM.tooltipTxt,
          borderColor:tcM.tooltipBorder, borderWidth:1, cornerRadius:6, padding:8,
          callbacks:{ label:function(c){ return ' '+c.formattedValue+'%'; } }
        }},
        scales:{
          x:{ grid:{display:false}, border:{display:false}, ticks:{color:tcM.tick, font:{size:9}, maxTicksLimit:5, maxRotation:0} },
          y:{ min:0, max:100,
            grid:{ color:tcM.grid, drawBorder:false },
            border:{ display:false },
            ticks:{ callback:function(v){ return v+'%'; }, color:tcM.tick, font:{size:9}, maxTicksLimit:3 }
          }
        }
      }
    });
  })();

  // --- LABEL SEÇÃO ---
  document.getElementById('pm-section-label').textContent = 'Inspeções — ' + labelFiltro;

  // --- BOs DO DIA ---
  document.getElementById('pm-bo-label').textContent = 'Problemas das máquinas — ' + labelFiltro;

  function tVal(v){ return v==='Sim'?'<span class="turno-val t-ok">Conforme</span>':v==='Não'?'<span class="turno-val t-no">Não conforme</span>':'<span class="turno-val t-nd">—</span>'; }

  function boCard(pm, p, compact) {
    var dn = pmDisplayName(pm);
    var totalErros = p.nc + p.teflonBarra + p.teflonSeladora + p.sensor;
    var cls = p.parada ? 'crit' : (totalErros === 0 ? 'ok' : 'warn');
    var totalPossivel = p.total * 4;
    var statusLabel = p.parada ? '🔴 MÁQUINA PARADA' : (totalErros === 0 ? 'OK ✓' : 'Atenção · ' + totalErros + '/' + totalPossivel + ' erros');
    if (compact) {
      return '<div class="pm-mini '+cls+'" onclick="window.openModal(\''+pm+'\')" style="cursor:pointer;padding:12px 16px;">'
        + '<div class="pm-mini-header"><span class="pm-mini-num">'+dn.num+' <span style="font-size:11px;font-weight:500;color:#aaa">'+dn.line+'</span></span><span class="pm-mini-status">'+statusLabel+'</span></div>'
        + '</div>';
    }
    return '<div class="pm-mini '+cls+'" onclick="window.openModal(\''+pm+'\')" style="cursor:pointer;">'
      + '<div class="pm-mini-header"><span class="pm-mini-num">'+dn.num+' <span style="font-size:11px;font-weight:500;color:#aaa">'+dn.line+'</span></span><span class="pm-mini-status">'+statusLabel+'</span></div>'
      + '<div class="pm-mini-turnos">'
        + '<div class="pm-mini-turno"><div class="pm-mini-turno-label">Início do dia</div>'+tVal(p.inicio)+'</div>'
        + '<div class="pm-mini-turno"><div class="pm-mini-turno-label">Final do dia</div>'+tVal(p.final)+'</div>'
      + '</div>'
      + '<div class="pm-mini-details">'
        + '<div class="pm-mini-det"><span class="pm-mini-det-label">Inspeções</span><span class="pm-mini-det-val">'+p.total+'</span></div>'
        + '<div class="pm-mini-det"><span class="pm-mini-det-label">Param. Err.</span><span class="pm-mini-det-val'+(p.nc>0?' al':'')+'">'+p.nc+'/6</span></div>'
        + '<div class="pm-mini-det"><span class="pm-mini-det-label">Teflon Barra</span><span class="pm-mini-det-val'+(p.teflonBarra>0?' al':'')+'">'+p.teflonBarra+'</span></div>'
        + '<div class="pm-mini-det"><span class="pm-mini-det-label">Teflon Sel.</span><span class="pm-mini-det-val'+(p.teflonSeladora>0?' al':'')+'">'+p.teflonSeladora+'</span></div>'
        + '<div class="pm-mini-det"><span class="pm-mini-det-label">Sensor</span><span class="pm-mini-det-val'+(p.sensor>0?' al':'')+'">'+p.sensor+'</span></div>'
      + '</div>'
      + '<div class="pm-mini-footer"><span class="pm-mini-footer-txt">Última: '+p.hora+' · Toque para detalhes</span></div>'
      + '</div>';
  }

  var comProblema = PMS.map(function(pm){
    var p = window.calcPM(dados, pm); if (!p) return null;
    var totalErros = p.nc + p.teflonBarra + p.teflonSeladora + p.sensor;
    if (totalErros === 0 && !p.parada) return null;
    return { pm: pm, p: p, erros: totalErros };
  }).filter(Boolean).sort(function(a,b){
    var pa = a.p.parada ? 1 : 0, pb = b.p.parada ? 1 : 0;
    if (pb !== pa) return pb - pa;
    return b.erros - a.erros;
  });

  var top3El = document.getElementById('pm-bo-top3');
  var emptyEl = document.getElementById('pm-bo-empty');
  var verMaisBtn = document.getElementById('pm-bo-ver-mais');

  verMaisBtn.textContent = 'Ver todas (' + PMS.length + ') →';
  if (comProblema.length === 0) {
    top3El.innerHTML = '';
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    top3El.innerHTML = comProblema.slice(0,3).map(function(x){ return boCard(x.pm, x.p, false); }).join('');
  }

  // Salva tipoMap para modal tipo
  var tipoMap = {};
  dados.forEach(function(r) {
    function reg(nome) {
      if (!tipoMap[nome]) tipoMap[nome] = { nome: nome, qtd: 0, maquinas: {} };
      tipoMap[nome].qtd++; tipoMap[nome].maquinas[r[COL.maquina]] = true;
    }
    if ((r[COL.conforme] && r[COL.conforme]!=='N/A')){ var ps=splitParams(r[COL.detalheParametro]); (ps.length?ps:['Parametrização']).forEach(function(det){ reg(det); }); }
    if (r[COL.teflonBarra]==='Sim')    reg('Rolo Teflon');
    if (r[COL.teflonSeladora]==='Sim') reg('Teflon Selagem');
    if (r[COL.sensor]==='Não')         reg('Sensor');
    if (r[COL.funcionamento]==='Não')  reg('Funcionamento');
    if (r[COL.impressao]==='Não')      reg('Impressão');
  });
  window._top3Data = tipoMap;

  // --- TOP 3 PROBLEMAS (barras) ---
  var top3probs = Object.keys(tipoMap).map(function(k){ return tipoMap[k]; })
    .sort(function(a,b){ return b.qtd-a.qtd; }).slice(0,3);
  var probSection = document.getElementById('pm-bo-top3-probs');
  var probBars = document.getElementById('pm-top3-bars');
  if (top3probs.length === 0) {
    probSection.style.display = 'none';
  } else {
    probSection.style.display = 'grid';
    var maxQtd = top3probs[0].qtd;
    probBars.innerHTML = top3probs.map(function(p, i) {
      var pct = Math.round((p.qtd / maxQtd) * 100);
      var mCount = Object.keys(p.maquinas).length;
      var isDk = document.documentElement.classList.contains('dark');
      return '<div style="padding:14px 0;border-bottom:1px solid rgba(128,128,128,0.1);">'
        + '<div style="font-size:13px;font-weight:600;color:'+(isDk?'#e0e0e0':'#222')+';margin-bottom:4px;">' + p.nome + '</div>'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        +   '<span style="font-size:12px;font-weight:700;color:#3b82f6;min-width:28px;">' + p.qtd + 'x</span>'
        +   '<span style="font-size:11px;color:'+(isDk?'#888':'#bbb')+'">' + mCount + ' máq.</span>'
        +   '<div style="flex:1;height:4px;border-radius:99px;background:'+(isDk?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)')+';overflow:hidden;margin-left:4px;">'
        +     '<div style="height:100%;width:'+pct+'%;background:#3b82f6;border-radius:99px;"></div>'
        +   '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    // --- PIE PARÂMETROS ---
    var paramPieMap = {};
    dados.forEach(function(r){
      if((r[COL.conforme] && r[COL.conforme]!=='N/A')){
        var ps = splitParams(r[COL.detalheParametro]); (ps.length?ps:['Parametrização']).forEach(function(p){ if(!paramPieMap[p]) paramPieMap[p]=0; paramPieMap[p]++; });
      }
    });
    var paramPieList = Object.keys(paramPieMap).map(function(k){ return{nome:k,qtd:paramPieMap[k]}; })
      .sort(function(a,b){ return b.qtd-a.qtd; }).slice(0,8);
    var pieColors = ['#ff4d4d','#ff7733','#ff9933','#3b82f6','#a855f7','#10b981','#f59e0b','#6366f1'];
    var dtc = getChartColors();
    if(pmParamsPieInstance) pmParamsPieInstance.destroy();
    var ctxPie = document.getElementById('pm-params-pie');
    if(ctxPie && paramPieList.length>0){
      pmParamsPieInstance = new Chart(ctxPie.getContext('2d'),{
        type:'doughnut',
        data:{ labels:paramPieList.map(function(p){ return p.nome; }), datasets:[{
          data:paramPieList.map(function(p){ return p.qtd; }),
          backgroundColor:paramPieList.map(function(p,i){ return pieColors[i]||'#aaa'; }),
          borderWidth:2, borderColor:dtc.dark?'#111':'#fff'
        }]},
        options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
          plugins:{
            legend:{ position:'bottom', labels:{ color:dtc.tooltipTxt, font:{size:10}, boxWidth:10, padding:8 } },
            tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
              callbacks:{ label:function(c){ return ' '+c.label+': '+c.formattedValue+'x'; } }
            }
          }
        }
      });
    }
  }


};
window.render = function() {
  clearTimeout(_renderTimer);
  _renderTimer = setTimeout(_renderFn, 16);
};

window.setFiltro = function(f,btn) {
  FILTRO=f;
  window._filtroDia=null; window._filtroMes=null;
  document.getElementById('periodo-picker').style.display='none';
  document.getElementById('pp-dia').value='';
  document.getElementById('pp-mes').value='';
  document.querySelectorAll('#tab-pms .f-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  window.render();
}

window.togglePeriodoPicker = function(btn) {
  var pk = document.getElementById('periodo-picker');
  var open = pk.style.display==='block';
  pk.style.display = open ? 'none' : 'block';
  if (!open) {
    // popula anos
    var sel = document.getElementById('pp-ano');
    if (!sel.options.length) {
      var y = new Date().getFullYear();
      for(var i=y;i>=y-4;i--){ var o=document.createElement('option'); o.value=i; o.textContent=i; sel.appendChild(o); }
      sel.value=y;
    }
  }
}

window.setPeriodoDia = function() {
  var val = document.getElementById('pp-dia').value;
  if (!val) return;
  var parts = val.split('-');
  var ano = parseInt(parts[0]); if (ano < 2000 || ano > 2099) return;
  var d = new Date(ano, parseInt(parts[1])-1, parseInt(parts[2]));
  d.setHours(0,0,0,0);
  window._filtroDia = d;
  window._filtroMes = null;
  document.getElementById('pp-mes').value='';
  FILTRO='dia-especifico';
  document.querySelectorAll('#tab-pms .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('fb-periodo').classList.add('active');
  document.getElementById('periodo-picker').style.display='none';
  window.render();
}

window.setPeriodoMes = function() {
  var m = document.getElementById('pp-mes').value;
  var a = document.getElementById('pp-ano').value;
  if (m==='' || !a) return;
  window._filtroMes = parseInt(m);
  window._filtroAno = parseInt(a);
  window._filtroDia = null;
  document.getElementById('pp-dia').value='';
  FILTRO='mes-especifico';
  document.querySelectorAll('#tab-pms .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('fb-periodo').classList.add('active');
  document.getElementById('periodo-picker').style.display='none';
  window.render();
}

window.clearPeriodo = function() {
  window._filtroDia=null; window._filtroMes=null;
  document.getElementById('pp-dia').value='';
  document.getElementById('pp-mes').value='';
  document.getElementById('periodo-picker').style.display='none';
  FILTRO='hoje';
  document.querySelectorAll('#tab-pms .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('fb-hoje').classList.add('active');
  window.render();
}

// Fechar popover ao clicar fora
document.addEventListener('click', function(e){
  var pk=document.getElementById('periodo-picker');
  var btn=document.getElementById('fb-periodo');
  if(pk && btn && !pk.contains(e.target) && e.target!==btn) pk.style.display='none';
});

var _modalPM = null;
var _modalFiltro = 'hoje';
var _modalFiltroDia = null;

window.setModalFiltro = function(f, btn) {
  _modalFiltro = f; _modalFiltroDia = null;
  document.getElementById('modal-periodo-picker').style.display = 'none';
  document.getElementById('mf-dia').value = '';
  document.querySelectorAll('#modal-filter-bar .f-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if (_modalPM) processarDadosModal(_modalPM);
};
window.setModalFiltroDia = function() {
  var val = document.getElementById('mf-dia').value; if (!val) return;
  var parts = val.split('-');
  var ano = parseInt(parts[0]); if (ano < 2000 || ano > 2099) return;
  _modalFiltroDia = new Date(ano, parseInt(parts[1])-1, parseInt(parts[2]));
  _modalFiltroDia.setHours(0,0,0,0);
  _modalFiltro = 'dia';
  document.getElementById('modal-periodo-picker').style.display = 'none';
  document.querySelectorAll('#modal-filter-bar .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('mf-periodo').classList.add('active');
  if (_modalPM) processarDadosModal(_modalPM);
};
window.toggleModalPicker = function(btn) {
  var pk = document.getElementById('modal-periodo-picker');
  pk.style.display = pk.style.display === 'block' ? 'none' : 'block';
};
document.addEventListener('click', function(e) {
  var pk = document.getElementById('modal-periodo-picker');
  var btn = document.getElementById('mf-periodo');
  if (pk && btn && !pk.contains(e.target) && e.target !== btn) pk.style.display = 'none';
});

window.openModal = function(pmName) {
  _modalPM = pmName;
  _modalFiltro = 'hoje'; _modalFiltroDia = null;
  document.getElementById('mf-dia').value = '';
  document.querySelectorAll('#modal-filter-bar .f-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('mf-hoje').classList.add('active');
  document.getElementById('modal-pm-name').textContent = pmName;
  // Status atual = última inspeção registrada (qualquer data)
  var dadosPM = DADOS.filter(function(r){
    var _maq = String(r[COL.maquina]||'').trim();
    var _pmNum = pmName.replace(/\s.*$/,'').toLowerCase();
    return _maq === pmName || _maq.replace(/\s.*$/,'').toLowerCase() === _pmNum;
  });
  var ultimaRow = null, ultimaTs = 0;
  dadosPM.forEach(function(r){
    var d = window.parseData(r); if (!d||isNaN(d)) return;
    var t = d.getTime(); if (t > ultimaTs){ ultimaTs = t; ultimaRow = r; }
  });
  var pStatus = ultimaRow ? { parada: ultimaRow[COL.funcionamento] === 'Não' } : null;
  var dotEl = document.getElementById('modal-pm-status-dot');
  var lblEl = document.getElementById('modal-pm-status-label');
  var wrapEl = document.getElementById('modal-pm-status');
  if (pStatus && dotEl && lblEl) {
    if (pStatus.parada) {
      dotEl.style.background = '#ff0000'; lblEl.style.color = '#cc0000'; lblEl.textContent = 'Parada';
    } else {
      dotEl.style.background = '#00a650'; lblEl.style.color = '#007a3d'; lblEl.textContent = 'Operando';
    }
    wrapEl.style.display = 'flex'; wrapEl.style.alignItems = 'center';
  } else if (wrapEl) { wrapEl.style.display = 'none'; }
  document.getElementById('details-modal').classList.add('active');
  document.getElementById('modal-loading').style.display='block';
  document.getElementById('modal-content-body').style.display='none';
  setTimeout(function(){ processarDadosModal(pmName); },300);
}
window.closeModal = function() {
  document.getElementById('details-modal').classList.remove('active');
}
document.getElementById('details-modal').addEventListener('click',function(e){ if(e.target===this) window.closeModal(); });

function processarDadosModal(pmName) {
  document.getElementById('modal-loading').style.display='block';
  document.getElementById('modal-content-body').style.display='none';
  var dadosPM = DADOS.filter(function(r){
    if(r[COL.maquina]!==pmName) return false;
    if(_modalFiltro==='hoje'){ var d=window.parseData(r); if(!d||isNaN(d)) return false; return _dk(d)===_dk(new Date()); }
    if(_modalFiltro==='dia' && _modalFiltroDia){ var d=window.parseData(r); if(!d||isNaN(d)) return false; return _dk(d)===_dk(_modalFiltroDia); }
    return true;
  });
  if(dadosPM.length===0){ document.getElementById('modal-loading').innerHTML='<p style="color:#999;text-align:center;padding:30px;">Sem dados para este período.</p>'; return; }
  var listaDetalhesHtml='';
  var rowsRecentes = dadosPM.sort(function(a,b){ return window.parseData(b)-window.parseData(a); }).slice(0,20);
  rowsRecentes.forEach(function(r){
    var def=[];
    if((r[COL.conforme] && r[COL.conforme]!=='N/A')){ var det=r[COL.detalheParametro]||'Sem detalhe'; def.push('<strong>Parametrização:</strong> '+det+(r[COL.obsTeflonBarra]?' — Obs: '+r[COL.obsTeflonBarra]:'')); }
    if(r[COL.teflonBarra]==='Sim')    def.push('Rolo Teflon Aquecimento com problema'+(r[COL.obsTeflonBarra]?' — '+r[COL.obsTeflonBarra]:''));
    if(r[COL.teflonSeladora]==='Sim') def.push('Teflon Selagem com problema'+(r[COL.obsTeflonSel]?' — '+r[COL.obsTeflonSel]:''));
    if(r[COL.sensor]==='Não')         def.push('Sensor de Segurança com problema'+(r[COL.obsSensor]?' — '+r[COL.obsSensor]:''));
    if(r[COL.funcionamento]==='Não')  def.push('Máquina sem funcionamento'+(r[COL.obsFuncionamento]?' — '+r[COL.obsFuncionamento]:''));
    if(r[COL.impressao]==='Não')      def.push('Impressão de Etiqueta com problema'+(r[COL.obsImpressao]?' — '+r[COL.obsImpressao]:''));
    if(def.length>0){ var d=window.parseData(r); var ds=d?d.toLocaleDateString('pt-BR')+' ('+r[COL.turno]+')':'Data inválida'; listaDetalhesHtml+='<div class="issue-item"><div class="issue-date">'+ds+'</div><div class="issue-desc">'+def.join('<br>')+'</div></div>'; }
  });
  if(!listaDetalhesHtml) listaDetalhesHtml='<p class="no-issues">Nenhuma ocorrência recente.</p>';
  document.getElementById('modal-details-list').innerHTML=listaDetalhesHtml;
  var histDiario={};
  dadosPM.forEach(function(r){
    var d=window.parseData(r); if(!d) return;
    var ds=d.toLocaleDateString('pt-BR');
    if(!histDiario[ds]) histDiario[ds]={somaScores:0,totalInspecoes:0};
    var ck=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A')) ck++; if(r[COL.teflonBarra]==='Não') ck++; if(r[COL.teflonSeladora]==='Não') ck++;
    if(r[COL.sensor]==='Sim') ck++; if(r[COL.funcionamento]==='Sim') ck++; if(r[COL.impressao]==='Sim') ck++;
    histDiario[ds].somaScores+=(ck/6)*100; histDiario[ds].totalInspecoes++;
  });
  var datasOrd=Object.keys(histDiario).sort(function(a,b){ return a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join('')); }).slice(-30);
  var labelsLinha=[]; var dadosLinha=[];
  datasOrd.forEach(function(ds){ var dia=histDiario[ds]; labelsLinha.push(ds.substring(0,5)); dadosLinha.push(Math.round(dia.somaScores/dia.totalInspecoes)); });
  var ofensores={'Parametrização':0,'Rolo Teflon':0,'Teflon Selagem':0,'Sensor':0,'Funcionamento':0,'Impressão':0};
  dadosPM.forEach(function(r){
    if((r[COL.conforme] && r[COL.conforme]!=='N/A'))       ofensores['Parametrização']++;
    if(r[COL.teflonBarra]==='Sim')    ofensores['Rolo Teflon']++;
    if(r[COL.teflonSeladora]==='Sim') ofensores['Teflon Selagem']++;
    if(r[COL.sensor]==='Não')         ofensores['Sensor']++;
    if(r[COL.funcionamento]==='Não')  ofensores['Funcionamento']++;
    if(r[COL.impressao]==='Não')      ofensores['Impressão']++;
  });
  var labelsRosca=[]; var dadosRosca=[];
  for(var k in ofensores){ if(ofensores[k]>0){ labelsRosca.push(k); dadosRosca.push(ofensores[k]); } }
  var paramContagem={};
  dadosPM.forEach(function(r){ if((r[COL.conforme] && r[COL.conforme]!=='N/A')){ splitParams(r[COL.detalheParametro]).forEach(function(p){ if(!paramContagem[p]) paramContagem[p]=0; paramContagem[p]++; }); } });
  var paramOrd=Object.keys(paramContagem).map(function(k){ return{nome:k,qtd:paramContagem[k]}; }).sort(function(a,b){ return b.qtd-a.qtd; });
  var paramHtml='';
  if(paramOrd.length>0){
    var mx=paramOrd[0].qtd;
    paramOrd.slice(0,10).forEach(function(item,idx){
      var pc=idx===0?'top1':idx===1?'top2':idx===2?'top3':'';
      var pct=Math.round((item.qtd/mx)*100);
      paramHtml+='<div class="param-rank-item"><div class="param-rank-left"><div class="param-rank-pos '+pc+'">'+(idx+1)+'</div><span class="param-rank-name">'+item.nome+'</span></div><div class="param-rank-bar-wrap"><div class="param-rank-bar"><div class="param-rank-bar-fill" style="width:'+pct+'%"></div></div><span class="param-rank-count">'+item.qtd+'</span></div></div>';
    });
  } else { paramHtml='<p class="no-issues">Nenhum ajuste registrado.</p>'; }
  document.getElementById('modal-param-ranking').innerHTML=paramHtml;
  renderizarGraficos(labelsLinha,dadosLinha,labelsRosca,dadosRosca);
  // --- HISTÓRICO DE PARADAS ---
  var todosDadosPM = DADOS.filter(function(r){ return r[COL.maquina]===pmName; });
  var agora = new Date();
  var semAgo = new Date(agora); semAgo.setDate(agora.getDate()-7);
  var mesAtual = agora.getMonth(); var anoAtual = agora.getFullYear();
  var paradasAll = todosDadosPM.filter(function(r){ return r[COL.funcionamento]==='Não'; });
  var paradasSemana = paradasAll.filter(function(r){
    var d = window.parseData(r); return d && d >= semAgo;
  });
  var paradasMes = paradasAll.filter(function(r){
    var d = window.parseData(r); return d && d.getMonth()===mesAtual && d.getFullYear()===anoAtual;
  });
  // Última parada
  var ultimaParada = null, ultimaParadaTs = 0;
  paradasAll.forEach(function(r){
    var d = window.parseData(r); if(!d) return;
    if(d.getTime() > ultimaParadaTs){ ultimaParadaTs = d.getTime(); ultimaParada = r; }
  });
  var paradasHtml = '';
  // KPIs
  paradasHtml += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">'
    + _modalKpiParada('Esta semana', paradasSemana.length)
    + _modalKpiParada('Este mês', paradasMes.length)
    + _modalKpiParada('Total histórico', paradasAll.length)
    + '</div>';
  // Últimas paradas listadas
  if (paradasAll.length === 0) {
    paradasHtml += '<p style="text-align:center;color:#aaa;font-size:12px;padding:8px 0;">Nenhuma parada registrada ✓</p>';
  } else {
    var ultimas = paradasAll.slice().sort(function(a,b){ return window.parseData(b)-window.parseData(a); }).slice(0,5);
    paradasHtml += '<div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Últimas ocorrências</div>';
    paradasHtml += '<div style="border-radius:10px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);">';
    ultimas.forEach(function(r, i){
      var d = window.parseData(r);
      var ds = d ? d.toLocaleDateString('pt-BR') + ' · ' + r[COL.turno] : '—';
      var obs = r[COL.obsFuncionamento] ? r[COL.obsFuncionamento] : '';
      var bg = i%2===0 ? 'rgba(0,0,0,0.01)' : 'transparent';
      paradasHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:'+bg+';border-bottom:1px solid rgba(0,0,0,0.04);">'
        + '<div>'
        +   '<span style="font-size:12px;font-weight:600;color:#cc2200;">🔴 '+ds+'</span>'
        +   (obs ? '<div style="font-size:11px;color:#aaa;margin-top:2px;">'+obs+'</div>' : '')
        + '</div>'
        + '</div>';
    });
    paradasHtml += '</div>';
  }
  document.getElementById('modal-paradas-body').innerHTML = paradasHtml;

  // Mensal usa TODOS os dados da PM (sem filtro de período)
  window._dadosPMAtual = todosDadosPM;
  _modalMesFoco = null;
  renderizarMensal(todosDadosPM);
  document.getElementById('modal-loading').style.display='none';
  document.getElementById('modal-content-body').style.display='block';
}

function renderizarGraficos(labelsLinha,dadosLinha,labelsRosca,dadosRosca) {
  if(lineChartInstance) lineChartInstance.destroy();
  if(doughnutChartInstance) doughnutChartInstance.destroy();
  var dtc = getChartColors();
  var ctxLine=document.getElementById('lineChartCanvas').getContext('2d');
  lineChartInstance=new Chart(ctxLine,{type:'line',data:{labels:labelsLinha,datasets:[{data:dadosLinha,borderColor:'#3b82f6',borderWidth:1.2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:'#3b82f6',tension:0.35,fill:true,
    backgroundColor:function(ctx){ var chart=ctx.chart,ca=chart.chartArea,c=chart.ctx; if(!ca) return 'transparent'; var g=c.createLinearGradient(0,ca.top,0,ca.bottom); g.addColorStop(0,dtc.dark?'rgba(59,130,246,0.22)':'rgba(59,130,246,0.10)'); g.addColorStop(1,'rgba(59,130,246,0)'); return g; }
  }]},options:{responsive:true,maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:false},tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,padding:10,callbacks:{title:function(items){return items[0].label;},label:function(c){return' '+c.formattedValue+'%';}}}},
    scales:{y:{min:0,max:100,grid:{color:dtc.grid},border:{display:false},ticks:{callback:function(v){return v+'%';},color:dtc.tick,font:{size:10},maxTicksLimit:5}},x:{grid:{display:false},border:{display:false},ticks:{color:dtc.tick,font:{size:10},maxTicksLimit:5,maxRotation:0}}}
  }});
  if(dadosRosca.length>0){
    var ctxD=document.getElementById('doughnutChartCanvas').getContext('2d');
    doughnutChartInstance=new Chart(ctxD,{type:'doughnut',data:{labels:labelsRosca,datasets:[{data:dadosRosca,backgroundColor:['#ff3333','#ff7733','#ff9933','#3b82f6'],borderWidth:2,borderColor:dtc.dark?'#111':'#fff'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:dtc.tooltipTxt,font:{size:11},boxWidth:12,padding:12}},tooltip:{backgroundColor:dtc.tooltip,titleColor:dtc.tooltipTxt,bodyColor:dtc.tooltipTxt,borderColor:dtc.tooltipBorder,borderWidth:1,cornerRadius:8,callbacks:{label:function(c){return' '+c.label+': '+c.formattedValue;}}}},cutout:'65%'}});
  } else {
    var ctxD=document.getElementById('doughnutChartCanvas').getContext('2d');
    ctxD.clearRect(0,0,ctxD.canvas.width,ctxD.canvas.height);
    ctxD.font="13px sans-serif"; ctxD.fillStyle=dtc.tick; ctxD.textAlign="center";
    ctxD.fillText("Nenhum defeito registrado.",ctxD.canvas.width/2,ctxD.canvas.height/2);
  }
}

function renderizarMensal(dadosPM) {
  var mesesNome = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var mensalMap = {};
  dadosPM.forEach(function(r) {
    var d = window.parseData(r); if (!d || isNaN(d)) return;
    var k = d.getFullYear() + '-' + String(d.getMonth()).padStart(2,'0');
    if (!mensalMap[k]) mensalMap[k] = { soma:0, qtd:0, mes:d.getMonth(), ano:d.getFullYear() };
    var ok=0;
    if((!r[COL.conforme] || r[COL.conforme]==='N/A'))       ok++;
    if(r[COL.teflonBarra]==='Não')    ok++;
    if(r[COL.teflonSeladora]==='Não') ok++;
    if(r[COL.sensor]==='Sim')         ok++;
    if(r[COL.funcionamento]==='Sim')  ok++;
    if(r[COL.impressao]==='Sim')      ok++;
    mensalMap[k].soma += (ok/6)*100; mensalMap[k].qtd++;
  });
  var keys = Object.keys(mensalMap).sort();
  var labels = keys.map(function(k){ var m=mensalMap[k]; return mesesNome[m.mes]+'/'+String(m.ano).slice(2); });
  var valores = keys.map(function(k){ return Math.round(mensalMap[k].soma/mensalMap[k].qtd); });

  // Popula picker de meses
  var picker = document.getElementById('modal-mes-picker');
  var btn = document.getElementById('modal-mes-btn');
  picker.innerHTML = '<div onclick="window.setModalMesFoco(null)" style="padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;border-radius:8px;margin-bottom:2px;background:'+(_modalMesFoco===null?'#3b82f6':'none')+';color:'+(_modalMesFoco===null?'#fff':'#333')+'">Todos os meses</div>'
    + keys.map(function(k, i) {
      var m = mensalMap[k];
      var label = mesesNome[m.mes]+' '+m.ano;
      var sel = _modalMesFoco === k;
      return '<div onclick="window.setModalMesFoco(\''+k+'\')" style="padding:8px 12px;cursor:pointer;font-size:12px;border-radius:8px;margin-bottom:2px;background:'+(sel?'#3b82f6':'none')+';color:'+(sel?'#fff':'#333')+'">'+label+'</div>';
    }).join('');

  var dtc = getChartColors();
  var bgColors = keys.map(function(k, i) {
    if (_modalMesFoco === null) return '#3b82f6';
    return k === _modalMesFoco ? '#3b82f6' : 'rgba(59,130,246,0.2)';
  });

  if (modalMensalChart) modalMensalChart.destroy();
  var ctx = document.getElementById('modal-mensal-chart'); if (!ctx) return;
  modalMensalChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: valores, backgroundColor: bgColors, borderRadius: 6, borderWidth: 0 }] },
    options: { responsive:true, maintainAspectRatio:false,
      plugins: { legend:{display:false},
        tooltip:{ backgroundColor:dtc.tooltip, titleColor:dtc.tooltipTxt, bodyColor:dtc.tooltipTxt, borderColor:dtc.tooltipBorder, borderWidth:1, cornerRadius:8,
          callbacks:{ label:function(c){ return ' '+c.formattedValue+'%'; } }
        }
      },
      scales: {
        y: { min:0, max:100, grid:{color:dtc.grid}, border:{display:false}, ticks:{callback:function(v){return v+'%';}, color:dtc.tick, font:{size:10}, maxTicksLimit:5} },
        x: { grid:{display:false}, border:{display:false}, ticks:{color:dtc.tick, font:{size:10}, maxRotation:0} }
      }
    }
  });

  if (_modalMesFoco) {
    var idx = keys.indexOf(_modalMesFoco);
    var m = mensalMap[_modalMesFoco];
    btn.textContent = mesesNome[m.mes]+' '+m.ano+' ▾';
  } else {
    btn.textContent = 'Todos os meses ▾';
  }
}

window._dadosPMAtual = [];
window.toggleModalMesPicker = function(btnEl) {
  var pk = document.getElementById('modal-mes-picker');
  pk.style.display = pk.style.display === 'block' ? 'none' : 'block';
};
window.setModalMesFoco = function(k) {
  _modalMesFoco = k;
  document.getElementById('modal-mes-picker').style.display = 'none';
  renderizarMensal(window._dadosPMAtual);
};
document.addEventListener('click', function(e) {
  var pk = document.getElementById('modal-mes-picker');
  var btn = document.getElementById('modal-mes-btn');
  if (pk && btn && !pk.contains(e.target) && e.target !== btn) pk.style.display = 'none';
});

function carregarDados() {
  google.script.run
    .withSuccessHandler(function(json) {
      var raw = JSON.parse(json);
      DADOS = raw.map(function(row) {
        var v = row[0];
        if (v) {
          if (typeof v === 'number') {
            row[0] = new Date(v);
          } else if (typeof v === 'string') {
            // "2026-04-11 12:21:40" (novo code.gs) ou "2026-04-11T12:21:40"
            var m = v.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/);
            if (m) {
              row[0] = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
            } else {
              // fallback formato BR "DD/MM/YYYY HH:MM:SS"
              var b = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2}):(\d{2})/);
              if (b) row[0] = new Date(+b[3], +b[2]-1, +b[1], +b[4], +b[5], +b[6]);
              else row[0] = new Date(v);
            }
          }
        }
        return row;
      });

      if (DADOS.length === 0) {
        document.getElementById('kpi-row').innerHTML = '<div class="loading">Planilha vazia ou aba não encontrada.</div>';
      } else {
        window.render();
        var desempTab = document.getElementById('tab-desempenho');
        if (desempTab && desempTab.style.display !== 'none') renderDesemp();
      }
    })
    .withFailureHandler(function(err) {
      document.getElementById('kpi-row').innerHTML = '<div class="loading" style="color:#e05555">Erro ao carregar dados: ' + err.message + '</div>';
    })
    .getDados();
}

function carregarDadosMock() {
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  function d(diasAtras, hora) {
    var dt = new Date(hoje); dt.setDate(dt.getDate() - diasAtras); dt.setHours(hora, Math.floor(Math.random()*59), 0, 0); return dt;
  }
  // row: [data, turno, maquina, conforme, detalheParam, teflonBarra, teflonSel, sensor, funcionamento, obsFun, turnoCode, obsTeflonBarra, obsSensor, obsTeflonSel, impressao, obsImpressao, checkItens, obsGeral]
  function row(dt, turno, maq, conf, det, tb, ts, sensor, func, imp) {
    return [dt, turno, maq, conf||'', det||'', tb||'Não', ts||'Não', sensor||'Sim', func||'Sim', '', turno, '', '', '', imp||'Sim', '', '', ''];
  }
  var rows = [];
  // --- HOJE ---
  rows.push(row(d(0,7),  'Início do turno','PM05 - IF21','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(0,19), 'Final do turno', 'PM05 - IF21','Temperatura','Temperatura','Sim','Não','Sim','Não','Sim'));
  rows.push(row(d(0,7),  'Início do turno','PM07 - IF22','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(0,19), 'Final do turno', 'PM07 - IF22','','',        'Não','Sim','Sim','Não','Sim'));
  rows.push(row(d(0,7),  'Início do turno','PM01 - IF21','Temperatura','Temperatura','Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(0,19), 'Final do turno', 'PM01 - IF21','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(0,7),  'Início do turno','PM09 - IF22','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(0,19), 'Final do turno', 'PM09 - IF22','','',        'Sim','Não','Sim','Não','Sim'));
  rows.push(row(d(0,7),  'Início do turno','PM11 - IF22','Velocidade','Velocidade','Não','Não','Não','Sim','Sim'));
  rows.push(row(d(0,19), 'Final do turno', 'PM11 - IF22','','',        'Não','Não','Sim','Sim','Sim'));
  ['PM02 - IF21','PM03 - IF21','PM04 - IF21','PM06 - IF21','PM08 - IF22','PM10 - IF22','PM12 - IF22'].forEach(function(m){
    rows.push(row(d(0,7),  'Início do turno', m,'','','Não','Não','Sim','Sim','Sim'));
    rows.push(row(d(0,19), 'Final do turno',  m,'','','Não','Não','Sim','Sim','Sim'));
  });
  // --- D-1 ---
  rows.push(row(d(1,7),  'Início do turno','PM05 - IF21','Temperatura','Temperatura','Sim','Não','Sim','Sim','Sim'));
  rows.push(row(d(1,19), 'Final do turno', 'PM05 - IF21','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(1,7),  'Início do turno','PM07 - IF22','','',        'Não','Sim','Sim','Não','Sim'));
  rows.push(row(d(1,19), 'Final do turno', 'PM07 - IF22','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(1,7),  'Início do turno','PM09 - IF22','','',        'Não','Não','Não','Sim','Sim'));
  rows.push(row(d(1,19), 'Final do turno', 'PM09 - IF22','','',        'Não','Não','Sim','Sim','Sim'));
  ['PM01 - IF21','PM02 - IF21','PM03 - IF21','PM04 - IF21','PM06 - IF21','PM08 - IF22','PM10 - IF22','PM11 - IF22','PM12 - IF22'].forEach(function(m){
    rows.push(row(d(1,7),  'Início do turno', m,'','','Não','Não','Sim','Sim','Sim'));
    rows.push(row(d(1,19), 'Final do turno',  m,'','','Não','Não','Sim','Sim','Sim'));
  });
  // --- D-2 ---
  rows.push(row(d(2,7),  'Início do turno','PM01 - IF21','Temperatura','Temperatura','Sim','Sim','Sim','Sim','Sim'));
  rows.push(row(d(2,19), 'Final do turno', 'PM01 - IF21','','',        'Não','Não','Sim','Não','Sim'));
  rows.push(row(d(2,7),  'Início do turno','PM12 - IF22','','',        'Não','Sim','Sim','Sim','Sim'));
  rows.push(row(d(2,19), 'Final do turno', 'PM12 - IF22','Velocidade','Velocidade','Não','Não','Sim','Sim','Sim'));
  ['PM02 - IF21','PM03 - IF21','PM04 - IF21','PM05 - IF21','PM06 - IF21','PM07 - IF22','PM08 - IF22','PM09 - IF22','PM10 - IF22','PM11 - IF22'].forEach(function(m){
    rows.push(row(d(2,7),  'Início do turno', m,'','','Não','Não','Sim','Sim','Sim'));
    rows.push(row(d(2,19), 'Final do turno',  m,'','','Não','Não','Sim','Sim','Sim'));
  });
  // --- D-3 ---
  rows.push(row(d(3,7),  'Início do turno','PM03 - IF21','','',        'Sim','Não','Sim','Sim','Não'));
  rows.push(row(d(3,19), 'Final do turno', 'PM03 - IF21','','',        'Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(3,7),  'Início do turno','PM07 - IF22','Temperatura','Temperatura','Não','Não','Sim','Sim','Sim'));
  rows.push(row(d(3,19), 'Final do turno', 'PM07 - IF22','','',        'Não','Não','Sim','Não','Sim'));
  ['PM01 - IF21','PM02 - IF21','PM04 - IF21','PM05 - IF21','PM06 - IF21','PM08 - IF22','PM09 - IF22','PM10 - IF22','PM11 - IF22','PM12 - IF22'].forEach(function(m){
    rows.push(row(d(3,7),  'Início do turno', m,'','','Não','Não','Sim','Sim','Sim'));
    rows.push(row(d(3,19), 'Final do turno',  m,'','','Não','Não','Sim','Sim','Sim'));
  });

  DADOS = rows;
  window.render();
  var desempTab = document.getElementById('tab-desempenho');
  if (desempTab && desempTab.style.display !== 'none') renderDesemp();
}

carregarDados();
setInterval(carregarDados, 5 * 60 * 1000);

// --- MODAL TIPO DE PROBLEMA ---
window.openTipoModal = function(nome) {
  var data = window._top3Data && window._top3Data[nome];
  if (!data) return;
  var maquinas = Object.keys(data.maquinas).sort();
  document.getElementById('tipo-modal-title').textContent = nome;
  document.getElementById('tipo-modal-sub').textContent = data.qtd + ' ocorrência' + (data.qtd>1?'s':'');
  document.getElementById('tipo-modal-list').innerHTML = maquinas.map(function(pm) {
    var p = window.calcPM(window.filtrarDados(DADOS), pm);
    var cls = p ? (p.taxa>=70?'ok':p.taxa>=50?'warn':'crit') : 'nd';
    var taxa = p ? p.taxa + '%' : '—';
    return '<div class="tipo-modal-item" onclick="window.closeTipoModal();window.openModal(\'' + pm + '\')">'
      + '<div class="tipo-modal-pm">' + pm.split(' ')[0] + '<span class="tipo-modal-line"> ' + (pm.split(' - ')[1]||'') + '</span></div>'
      + '<span class="nc-badge-' + cls + '">' + taxa + '</span>'
      + '</div>';
  }).join('');
  document.getElementById('tipo-modal').classList.add('active');
}
window.closeTipoModal = function() {
  document.getElementById('tipo-modal').classList.remove('active');
}
var _tpm = document.getElementById('tipo-modal'); if(_tpm) _tpm.addEventListener('click', function(e){ if(e.target===this) window.closeTipoModal(); });

window.openMaqProblemasModal = function() {
  var map = window._maqsComErroMap || {};
  var pms = Object.keys(map).sort();
  document.getElementById('maq-prob-sub').textContent = pms.length + ' máquina' + (pms.length!==1?'s com':'com') + ' algum problema';
  document.getElementById('maq-prob-list').innerHTML = pms.map(function(pm) {
    var e = map[pm];
    var tags = [];
    if(e.nc>0) tags.push('<span style="color:#ff3333;font-size:11px;font-weight:600;">Param. '+e.nc+'x</span>');
    if(e.teflonBarra>0) tags.push('<span style="color:#ff7733;font-size:11px;font-weight:600;">Teflon Barra '+e.teflonBarra+'x</span>');
    if(e.teflonSeladora>0) tags.push('<span style="color:#ff9933;font-size:11px;font-weight:600;">Teflon Sel. '+e.teflonSeladora+'x</span>');
    if(e.sensor>0) tags.push('<span style="color:#3b82f6;font-size:11px;font-weight:600;">Sensor '+e.sensor+'x</span>');
    var dn = pm.split(' - ');
    return '<div class="tipo-modal-item" style="cursor:pointer;" onclick="window.closeMaqProblemasModal();window.openModal(\''+pm+'\')">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div><span class="tipo-modal-pm">'+dn[0]+'</span> <span class="tipo-modal-line">'+( dn[1]||'')+'</span></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">'+tags.join('')+'</div>'
      + '</div></div>';
  }).join('');
  document.getElementById('maq-prob-modal').classList.add('active');
};
window.closeMaqProblemasModal = function() {
  document.getElementById('maq-prob-modal').classList.remove('active');
};]
var _mqpm = document.getElementById('maq-prob-modal'); if(_mqpm) _mqpm.addEventListener('click', function(e){ if(e.target===this) window.closeMaqProblemasModal(); });