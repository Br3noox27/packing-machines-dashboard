# Packing Machines Dashboard

Dashboard de monitoramento de inspeções das máquinas de embalagem (PMs) das linhas IF21 e IF22.

---

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index2.html` | Versão separada — HTML limpo que linka os arquivos externos |
| `style.css` | Todos os estilos visuais (cores, tamanhos, layout) |
| `java.js` | Toda a lógica JavaScript (dados, gráficos, filtros, modais) |

---

## Como funciona

```
index2.html
    │
    ├── <link rel="stylesheet" href="style.css">   → estilos visuais
    └── <script src="java.js"></script>             → lógica e dados
```

---

## Funcionalidades

- **Aba PMs** — cards de cada máquina com taxa de conformidade por turno
- **Aba Desempenho** — gráficos de tendência, pareto de defeitos e ranking de parâmetros
- **Filtros** — Hoje / Ontem / Dia específico / Mês inteiro
- **Dark mode** — alterna entre tema claro e escuro
- **Modais** — detalhes de cada máquina com histórico e gráficos

---

## Máquinas monitoradas

**Linha IF21:** PM01, PM02, PM03, PM05, PM07, PM08  
**Linha IF22:** PM09, PM10, PM11, PM12, PM13, PM14

---

## Tipos de defeito rastreados

| Defeito | Como é detectado |
|---|---|
| Parametrização | Coluna `conforme` = "Não" |
| Teflon Barra | Coluna `teflonBarra` = "Sim" |
| Teflon Seladora | Coluna `teflonSeladora` = "Sim" |
| Sensor | Coluna `sensor` = "Não" |

---

## Dados

- **Produção:** conectado ao Google Apps Script via `carregarDados()` → busca de uma planilha Google Sheets
- **Desenvolvimento/teste:** bloco de dados fictícios no `java.js` (ativar descomentando o bloco `(function(){...})()` e comentando `carregarDados()`)
