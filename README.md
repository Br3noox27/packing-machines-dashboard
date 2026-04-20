1. Técnico de manutenção abre o **Google Forms** no celular no início 
   e no final do turno
2. Registra o status de cada parâmetro da máquina (temperatura de selagem, 
   velocidade da esteira, pressão do cilindro, altura do corte, teflon 
   seladora, teflon barra, sensor)
3. Dados alimentam automaticamente um **Google Sheets**
4. **Google Apps Script** expõe os dados como API
5. **Dashboard** atualiza automaticamente a cada **5 minutos**
6. Supervisores e líderes recebem **email automático toda segunda-feira** 
   com o resumo da semana

---

## 🏗 Arquitetura

<p align="center">
  <img src="docs/screenshots/architecture-diagram.png" alt="Arquitetura" width="700">
</p>

**Frontend:** HTML + CSS + JavaScript puro + Chart.js + Tailwind CSS  
**Backend:** Google Apps Script (serverless, zero infra)  
**Banco de dados:** Google Sheets (single source of truth)  
**Entrada de dados:** Google Forms (acessível de qualquer celular)  
**Automação:** Trigger do Apps Script envia email semanal  

---

## 🤔 Por que essa stack?

Decisão consciente baseada em **restrições do contexto**, não ausência 
de alternativa:

- **Zero burocracia de infraestrutura**: operação não comportava 
  provisionamento de servidor, domínio ou custo recorrente de cloud
- **Adoção zero-fricção**: técnicos já usavam celular e Google no dia 
  a dia. Qualquer dispositivo, qualquer hora, sem instalar nada
- **Ecossistema Google já aprovado**: a empresa já usava Workspace, 
  então não passei por aprovação de ferramenta nova (que travaria o 
  projeto por semanas)
- **Entrega em ~2 semanas**: MVP em produção rápido valia mais que 
  arquitetura ideal. Validar que a equipe ia **usar** era mais importante 
  que a stack
- **Manutenção simples**: se eu sair, qualquer pessoa com conhecimento 
  básico de Apps Script consegue dar continuidade

**Engenharia é sobre contexto.** Pra 12 máquinas e ~24 registros/dia, 
Sheets é mais que suficiente. Se a operação crescer pra múltiplos CDs 
ou centenas de máquinas, a v2 em FastAPI + PostgreSQL já está planejada.

---

## ✨ Funcionalidades

**Monitoramento em tempo real**
- Status instantâneo de cada máquina (crítico / atenção / ok)
- Máquinas com BO piscam em vermelho
- Atualização automática a cada 5 minutos

**KPIs e análise**
- Total de inspeções do dia
- Quantas máquinas estão com problema (ex: 7/12)
- Taxa geral de conformidade vs meta (77% vs 70%)
- Comparação com dia anterior (▼ -11%)
- Conformidade histórica em linha temporal

**Aba de desempenho**
- Ranking de máquinas com mais ocorrências (PM08, PM12, PM03...)
- Pareto dos tipos de defeito (Parametrização, Teflon Seladora, 
  Teflon Barra, Sensor)
- Distribuição dos parâmetros com mais erros (Temperatura selagem, 
  Velocidade da esteira, Pressão do cilindro, Altura do corte)
- Top 3 problemas recorrentes do dia

**Interação e detalhe**
- Modal clicável com detalhamento por máquina
- Histórico de BOs por turno (início do dia / final do dia)
- Filtros: Hoje / Ontem / Período customizado

**UX industrial**
- Dark mode completo (otimizado pra galpões com iluminação variável)
- Responsivo (desktop e mobile)
- Tipografia e contraste pensados pra leitura à distância

**Automação**
- Email semanal automático com resumo consolidado para supervisores 
  e líderes

---

## ⚠️ Limitações conhecidas

Sendo transparente sobre o que a stack atual **não resolve**:

- **Escalabilidade**: Google Sheets suporta ~50k linhas bem. Com ~24 
  registros/dia, isso dá ~5 anos de dados. Pra mais que isso, precisa 
  migrar pra banco relacional.
- **Autenticação granular**: todo mundo com o link tem o mesmo nível 
  de acesso. Sem perfis diferenciados (técnico vs supervisor vs gestor).
- **Sem API pública**: integração com outros sistemas da operação 
  exigiria trabalho adicional no Apps Script.
- **Dependência do Google Workspace**: mudar de ecossistema demandaria 
  reescrita.
- **Pode ficar lento** se o volume de dados crescer muito além da escala atual.

---

## 🚀 Próximos passos (v2 em planejamento)

Reescrita prevista com stack de produção pra suportar múltiplos CDs:

- **Backend:** FastAPI + PostgreSQL + SQLAlchemy + Alembic
- **Fila assíncrona:** Celery + Redis pra processamento de alertas 
  e envio de emails
- **Frontend:** Next.js + Tailwind + Recharts (mantendo a UX do v1)
- **Autenticação:** JWT com perfis diferenciados
- **Deploy:** Docker + Railway/Fly.io
- **CI/CD:** GitHub Actions com pytest + lint + build

---

## 👤 Autor

**Breno Laurentino**  
Desenvolvedor Python · Análise e Desenvolvimento de Sistemas @ FIAP  

- 💼 [LinkedIn](https://linkedin.com/in/breno-laurentino/)
- 🐙 [GitHub](https://github.com/Br3noox27)
- 📧 brenolaurentino008@gmail.com

---

## 🙏 Agradecimentos

Ao líder da equipe de manutenção que pediu a ferramenta e deu liberdade 
pra expandir o escopo original, e à equipe de técnicos que usa o sistema 
no dia a dia e deu feedback constante durante o desenvolvimento.