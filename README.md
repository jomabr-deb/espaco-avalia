# Espaço Avalia

Sistema de gerenciamento de documentos avaliativos da **Escola Espaço da Criança** — Curitiba/PR.

## Funcionalidades

### Interface da Professora (mobile-first)
- Login por código de acesso (6 caracteres)
- Preenchimento do QSI (Questionário de Sondagem Inicial) por seções
- Autosave a cada 2 segundos
- Visualização de status: rascunho, finalizado, devolvido
- Consulta de documentos dos alunos (PD, Estudo de Caso, PAEE, PEI)

### Interface da Direção/Coordenação (desktop + mobile)
- Dashboard com estatísticas em tempo real
- Gestão de alunos: edição, inclusão, desativação
- Fluxo de QSI: revisar → devolver com observação → validar
- Exportação DOCX individual e backup JSON
- Importação de alunos do ERP com tela de conciliação
- Gestão de professoras: códigos de acesso, atribuição de turmas
- Configuração de prazos semestrais

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel (deploy automático via GitHub)
- **Exportação**: docx-js (geração de documentos Word)

## Estrutura

```
src/
├── app/
│   ├── login/              → Login unificado
│   ├── professora/         → Interface mobile
│   │   ├── qsi/            → Formulário QSI
│   │   └── docs/           → Consulta documentos
│   ├── admin/              → Painel direção
│   │   ├── alunos/         → Gestão de alunos + importação
│   │   ├── qsi/            → Gestão QSI + exportação
│   │   ├── docs/           → Upload documentos
│   │   ├── professoras/    → Gestão professoras
│   │   ├── config/         → Prazos + backup
│   │   └── sobre/          → Página Sobre
│   └── api/                → API routes
├── components/             → Componentes reutilizáveis
└── lib/                    → Configuração, tipos, utilitários
```

## Configuração

### Variáveis de ambiente

Criar `.env.local` na raiz:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Desenvolvimento local

```bash
npm install
npm run dev
```

## Dados

- **145 alunos** em 6 turmas (Berçário a Infantil 5)
- **12 templates QSI** (6 turmas × 2 semestres)
- **12 professoras** com códigos de acesso individuais

---

**Versão 1.0** — EC Atividades Educacionais Ltda. — Todos os direitos reservados.
