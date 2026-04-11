# Espaço Avalia — Roteiro de Testes

Use este roteiro para validar o sistema com a equipe antes do lançamento.

---

## 1. Teste de Login — Professora (celular)

**Quem testa:** Uma professora real (sugestão: Melissa — Infantil 3A)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o link do app no celular | Tela de login aparece com logo |
| 2 | Clicar "Acesso Professora" | Campo de código aparece |
| 3 | Digitar código (ex: QWDQCW) | Botão "Entrar" fica ativo |
| 4 | Clicar "Entrar" | Redireciona para Home da professora |
| 5 | Verificar nome e turma no header | Nome e turma corretos |
| 6 | Verificar contagem de alunos | Número corresponde à turma |
| 7 | Verificar banner de prazo | Data e contagem de dias corretas |
| 8 | Clicar "Sair" | Volta para tela de login |
| 9 | Digitar código errado | Mensagem "Código inválido" aparece |

---

## 2. Teste de Preenchimento do QSI (celular)

**Quem testa:** A mesma professora

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Na Home, clicar "Preencher QSI" | Lista de alunos aparece |
| 2 | Verificar se só aparecem alunos da sua turma | Apenas alunos do Infantil 3A |
| 3 | Clicar em um aluno | Formulário QSI abre na seção 1 |
| 4 | Marcar 3-4 itens como NA, AP, ED ou C | Botões mudam de cor |
| 5 | Esperar 2 segundos | "✓ Salvo" aparece no canto |
| 6 | Digitar texto em um campo descritivo | Texto é salvo automaticamente |
| 7 | Clicar nos dots para mudar de seção | Conteúdo muda, dots atualizam |
| 8 | Clicar "Próximo" e "Anterior" | Navegação funciona |
| 9 | Fechar o navegador sem finalizar | — |
| 10 | Reabrir o app e voltar ao mesmo aluno | Dados preenchidos estão lá |
| 11 | Verificar barra de progresso | Porcentagem reflete o preenchido |
| 12 | Ir até a última seção | Botão "Finalizar QSI" aparece |
| 13 | Clicar "Finalizar QSI" | Redireciona para lista, status = Finalizado |
| 14 | Voltar ao aluno finalizado | Formulário está travado (não editável) |

---

## 3. Teste de Login — Direção (desktop e celular)

**Quem testa:** Jomar, Zuleide ou Eloise

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o link do app no computador | Tela de login |
| 2 | Clicar "Direção / Coordenação" | Campos email e senha |
| 3 | Digitar email e senha | Login bem-sucedido |
| 4 | Dashboard aparece | Cards com contagens reais |
| 5 | Sidebar mostra todas as seções | 6 itens + Sobre |
| 6 | Repetir no celular | Menu hamburger funciona |

---

## 4. Teste do Fluxo de Revisão do QSI (desktop)

**Pré-requisito:** Um QSI já finalizado pela professora (teste 2)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Ir em QSI | Lista com alunos e status |
| 2 | Encontrar QSI "Finalizado" | Badge verde "● Finalizado" |
| 3 | Clicar "🔍 Revisar" | Status muda para "Em revisão" |
| 4 | Clicar "↩ Devolver" | Modal pede observação |
| 5 | Digitar observação e confirmar | Status muda para "Devolvido" |
| 6 | **Como professora**: voltar ao QSI | Banner laranja com observação aparece |
| 7 | **Como professora**: editar e finalizar novamente | Status volta para "Finalizado" |
| 8 | **Como admin**: clicar "✓ Validar" | Status muda para "Validado" (definitivo) |

---

## 5. Teste de Gestão de Alunos (desktop)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Ir em Alunos | Tabela com 145 alunos |
| 2 | Filtrar por "Infantil 3" | Apenas alunos do I3 |
| 3 | Buscar por nome | Filtro funciona |
| 4 | Clicar "✏️ Editar" em um aluno | Modal com todos os campos |
| 5 | Marcar "Aluno de inclusão" | Salva corretamente |
| 6 | Clicar "Desativar" | Aluno some da lista |
| 7 | Marcar "Inativos" | Aluno desativado reaparece |
| 8 | Clicar "Reativar" | Aluno volta ao normal |

---

## 6. Teste de Importação (desktop)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Alunos → "Importar ERP (.xls)" | Página de importação |
| 2 | Selecionar arquivo .xls do ERP | Sistema processa |
| 3 | Tela de conciliação aparece | 4 categorias com cores |
| 4 | Verificar alunos "Sem alterações" | Maioria (dados já carregados) |
| 5 | Revisar mudanças (se houver) | Checkboxes campo a campo |
| 6 | Clicar "Revisar e Confirmar" | Resumo numérico |
| 7 | Clicar "Confirmar e Aplicar" | Tela de conclusão |

---

## 7. Teste de Exportação (desktop)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | QSI → "⬇ DOCX" (em QSI preenchido) | Arquivo .docx é baixado |
| 2 | Abrir o .docx | Tabelas com checklist e respostas |
| 3 | QSI → "📋 Copiar" | Texto copiado para clipboard |
| 4 | Colar em Word/Notepad | Dados formatados aparecem |
| 5 | Configurações → "Exportar Backup" | Arquivo .json é baixado |

---

## 8. Teste de Gestão de Professoras (desktop)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Ir em Professoras | Cards com todas as professoras |
| 2 | Verificar códigos de acesso | Códigos aparecem em destaque |
| 3 | Clicar "🔄 Novo Código" | Confirma e mostra novo código |
| 4 | Clicar "✏️ Editar" | Modal com campos editáveis |

---

## 9. Teste de Prazo (desktop)

| Passo | Ação | Resultado esperado |
|---|---|---|
| 1 | Configurações → Prazos | Prazo ativo aparece |
| 2 | Toggle "Permitir atraso" | Alterna configuração |
| 3 | "Criar Novo Prazo" | Modal com ano, semestre, data |
| 4 | Criar prazo do 2º semestre | Prazo anterior desativa, novo ativa |

---

## Checklist Final

- [ ] Login professora funciona no celular
- [ ] Login admin funciona no desktop e celular
- [ ] QSI preenche e salva automaticamente
- [ ] QSI finalizado trava edição
- [ ] Fluxo revisar/devolver/validar funciona
- [ ] Devolução aparece como banner na tela da professora
- [ ] Importação do ERP funciona com conciliação
- [ ] Exportação DOCX gera documento correto
- [ ] Backup JSON exporta todos os dados
- [ ] Professora só vê alunos da sua turma
- [ ] Admin vê todos os alunos
- [ ] App responsivo no celular (menu hamburger)
- [ ] Página Sobre mostra informações corretas
