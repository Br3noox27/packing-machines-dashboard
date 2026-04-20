# Packing Machines Dashboard 🏭

> Sistema web de monitoramento em tempo real de máquinas de embalagem, integrado ao Google Sheets via Apps Script.

---

## 🇧🇷 Português

### O Problema
Operações industriais com múltiplas máquinas precisam de visibilidade em tempo real sobre desempenho, paradas e problemas — sem depender de softwares caros ou infraestrutura complexa.

### A Solução
Dashboard web completo construído com HTML, CSS e JavaScript puro, usando Google Apps Script como backend e Google Sheets como banco de dados. Zero custo de servidor. Dados atualizados automaticamente a cada 5 minutos.

### Funcionalidades
- **Monitoramento em tempo real** — status de cada máquina (operando, alerta, parada)
- **KPIs automáticos** — taxa de eficiência, número de paradas, ocorrências por turno
- **Gráficos de desempenho** — evolução mensal, comparativo por máquina, distribuição por tipo de problema
- **Filtros dinâmicos** — por período, turno e máquina
- **Modal de detalhes** — histórico completo de cada máquina com gráfico mensal
- **Dark mode** — interface adaptável ao ambiente industrial
- **Responsivo** — funciona em desktop e mobile
- **Alertas visuais** — máquinas paradas pulsam em vermelho em tempo real

### Arquitetura
```
Google Forms → Google Sheets → Apps Script (backend) → Dashboard Web (frontend)
```
- **Frontend:** HTML + CSS + JavaScript + Chart.js + Tailwind CSS
- **Backend:** Google Apps Script (servidor sem infraestrutura)
- **Banco de dados:** Google Sheets (atualização em tempo real)
- **Integração:** Google Forms para entrada de dados de manutenção

### Como funciona
1. Técnico registra ocorrência via Google Forms (tipo de problema, máquina, turno)
2. Dados alimentam automaticamente o Google Sheets
3. Apps Script expõe os dados como API para o dashboard
4. Dashboard atualiza automaticamente a cada 5 minutos
5. Gestão visualiza status de todas as máquinas em tempo real

### Resultado
- Visibilidade total do chão de fábrica sem software pago
- Identificação imediata de máquinas com maior índice de parada
- Histórico de manutenção organizado e acessível
- Decisões baseadas em dados, não em planilha manual

### Tecnologias
- HTML5 / CSS3 / JavaScript
- Google Apps Script
- Google Sheets
- Chart.js
- Tailwind CSS

---

## 🇺🇸 English

### The Problem
Industrial operations with multiple machines need real-time visibility into performance, downtime, and issues — without relying on expensive software or complex infrastructure.

### The Solution
A full web dashboard built with HTML, CSS, and vanilla JavaScript, using Google Apps Script as a backend and Google Sheets as a database. Zero server cost. Data updates automatically every 5 minutes.

### Features
- **Real-time monitoring** — status of each machine (running, warning, stopped)
- **Automatic KPIs** — efficiency rate, downtime count, incidents per shift
- **Performance charts** — monthly trends, machine comparison, problem type breakdown
- **Dynamic filters** — by period, shift, and machine
- **Detail modal** — full history for each machine with monthly chart
- **Dark mode** — UI adapted for industrial environments
- **Responsive** — works on desktop and mobile
- **Visual alerts** — stopped machines pulse red in real time

### Architecture
```
Google Forms → Google Sheets → Apps Script (backend) → Web Dashboard (frontend)
```
- **Frontend:** HTML + CSS + JavaScript + Chart.js + Tailwind CSS
- **Backend:** Google Apps Script (serverless)
- **Database:** Google Sheets (real-time updates)
- **Data entry:** Google Forms for maintenance logging

### How it works
1. Technician logs an incident via Google Forms (problem type, machine, shift)
2. Data automatically feeds into Google Sheets
3. Apps Script exposes data as an API to the dashboard
4. Dashboard auto-refreshes every 5 minutes
5. Management views all machine statuses in real time

### Result
- Full factory floor visibility with no paid software
- Immediate identification of machines with highest downtime rates
- Organized, accessible maintenance history
- Data-driven decisions instead of manual spreadsheet tracking

### Tech Stack
- HTML5 / CSS3 / JavaScript
- Google Apps Script
- Google Sheets
- Chart.js
- Tailwind CSS