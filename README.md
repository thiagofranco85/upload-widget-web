# Upload Widget — Web

Interface de upload de imagens com compressão no navegador, feedback de progresso em tempo real e possibilidade de cancelar envios em andamento. É o front-end do projeto; o back-end que recebe os arquivos fica em [upload-widget-server](https://github.com/thiagofranco85/rocketseat-pos-widget-server).

Produção: https://upload-widget.thiagofranco.com.br

---

## O que o projeto faz

O usuário arrasta uma ou mais imagens para a área de upload. Para cada arquivo, a aplicação:

1. Gera um identificador e registra o upload na lista.
2. Comprime a imagem no próprio navegador — redimensiona para no máximo 1000×1000px e converte para WebP com qualidade 0.8.
3. Envia o arquivo comprimido para a API, reportando o progresso byte a byte.
4. Exibe a URL pública devolvida pelo servidor, com botões para copiar ou baixar.

Cada upload pode ser cancelado no meio do envio ou repetido em caso de erro. Formatos aceitos: JPG, JPEG, PNG e WebP.

---

## Tecnologias envolvidas

### Base

| Tecnologia | Papel |
|------------|-------|
| **React 18** | Biblioteca de interface |
| **TypeScript 5.6** | Tipagem estática |
| **Vite 6** | Servidor de desenvolvimento e bundler de produção |

### Estado e dados

| Tecnologia | Papel |
|------------|-------|
| **Zustand 5** | Store global dos uploads |
| **Immer** | Permite escrever mutações diretas na store; o Immer gera o novo estado imutável por baixo |
| **Axios** | Cliente HTTP — usado por dar acesso a `onUploadProgress` e a cancelamento via `AbortController` |

### Interface

| Tecnologia | Papel |
|------------|-------|
| **Tailwind CSS 4** | Estilização utilitária, via plugin oficial do Vite |
| **tailwind-variants** | Define variantes de componentes (tamanho, estado) sem concatenar classes na mão |
| **Radix UI** | Primitivas acessíveis: `Collapsible`, `Progress`, `ScrollArea` |
| **Motion** | Animações de entrada, saída e transição do widget |
| **Lucide React** | Ícones |
| **react-dropzone** | Área de arrastar-e-soltar arquivos |

### Qualidade

| Tecnologia | Papel |
|------------|-------|
| **ESLint 9** | Linter, com plugins de React Hooks e React Refresh |

---

## Como as peças se relacionam

O centro da aplicação é a store do Zustand (`src/store/uploads.ts`). Ela guarda um `Map<string, Upload>` — a chave é um UUID gerado por upload, e o valor tem nome, arquivo, status, tamanhos e o `AbortController` daquele envio.

```
Usuário solta arquivos
        │
        ▼
  UploadWidgetDropzone (react-dropzone)
        │  addUploads(files)
        ▼
┌──────────────────────────────────────────────────────┐
│  store/uploads.ts  (Zustand + Immer)                 │
│                                                      │
│  addUploads()                                        │
│   └─ cria UUID, grava no Map, chama processUpload()  │
│                                                      │
│  processUpload()                                     │
│   ├─ compressImage()   → utils/compress-image.ts     │
│   │   (Canvas API: redimensiona + converte p/ WebP)  │
│   ├─ uploadFileToStorage() → http/                   │
│   │   (Axios POST, onUploadProgress atualiza a store)│
│   └─ grava status final: success | error | canceled  │
│                                                      │
│  cancelUpload()                                      │
│   └─ abortController.abort() → Axios lança           │
│      CanceledError → status "canceled"               │
└──────────────────────────────────────────────────────┘
        │
        ▼
  Componentes leem a store e re-renderizam
  (useShallow evita render desnecessário)
        │
        ▼
  API: POST {VITE_API_URL}/uploads → URL pública no Cloudflare R2
```

Dois pontos que valem destaque:

**A compressão acontece antes do envio.** `compress-image.ts` usa a API de Canvas do navegador: lê o arquivo como Data URL, desenha num canvas redimensionado e exporta via `canvas.toBlob()` em WebP. O servidor recebe um arquivo bem menor que o original, o que também ajuda a respeitar o limite de 4 MB da API.

**O progresso global é derivado, não armazenado.** O hook `usePendingUploads` percorre a store e calcula a porcentagem somando bytes enviados sobre bytes totais. Como usa `useShallow`, os componentes só re-renderizam quando o valor calculado muda de fato.

### Estrutura de arquivos

```
src/
├── main.tsx                     # Ponto de entrada do React
├── app.tsx                      # Componente raiz
├── index.css                    # Tema e diretivas do Tailwind
├── components/
│   ├── upload-widget.tsx                 # Container do widget (Collapsible)
│   ├── upload-widget-header.tsx          # Cabeçalho
│   ├── upload-widget-title.tsx           # Título + progresso global
│   ├── upload-widget-dropzone.tsx        # Área de arrastar-e-soltar
│   ├── upload-widget-upload-list.tsx     # Lista de uploads (ScrollArea)
│   ├── upload-widget-upload-item.tsx     # Item individual: progresso e ações
│   ├── upload-widget-minimized-button.tsx# Botão flutuante quando minimizado
│   └── ui/
│       ├── button.tsx                    # Botão com variantes
│       └── circular-progress-bar.tsx     # Indicador circular de progresso
├── store/
│   └── uploads.ts               # Store Zustand: estado e ações de upload
├── http/
│   └── upload-file-to-storage.ts# Chamada POST /uploads com progresso
└── utils/
    ├── compress-image.ts        # Compressão e conversão para WebP
    ├── format-bytes.ts          # Formata bytes em KB/MB
    └── download-url.ts          # Dispara download de uma URL
```

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- O back-end rodando — veja o [repositório do servidor](https://github.com/thiagofranco85/rocketseat-pos-widget-server)

### 1. Clone e instale

```bash
git clone https://github.com/thiagofranco85/upload-widget-web.git
cd upload-widget-web
pnpm install
```

### 2. Configure a URL da API

Crie um arquivo `.env.local` na raiz:

```env
VITE_API_URL=http://localhost:3333
```

Se a variável não existir, a aplicação usa `http://localhost:3333` como padrão — ou seja, para desenvolvimento local com o servidor na porta padrão, esse passo é opcional.

Em produção, a variável é configurada no painel da Vercel e aponta para `https://server-widget.thiagofranco.com.br`.

### 3. Rode em desenvolvimento

```bash
pnpm dev
```

A aplicação sobe em `http://localhost:5173`.

### 4. Build de produção

```bash
pnpm build     # Type-check (tsc -b) + build do Vite → dist/
pnpm preview   # Serve o build localmente para conferência
```

---

## Deploy

O deploy é automático via GitHub Actions:

| Evento | Workflow | Resultado |
|--------|----------|-----------|
| Push na `main` | `.github/workflows/main.yml` | Deploy de produção na Vercel |
| Push em qualquer outra branch | `.github/workflows/preview.yml` | Deploy de preview na Vercel |

Ambos os workflows usam a CLI da Vercel (`vercel pull` → `vercel build` → `vercel deploy --prebuilt`), autenticada pelos secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.
