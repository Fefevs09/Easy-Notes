# Easy Notes

CONTEXTO DO PROJETO:

- Tipo: Clone do Samsung Notes para macOS
- Stack: Electron + React + Fabric.js/Konva.js + TypeScript
- Objetivo: Replicar 100% das funcionalidades e design
- Prioridade: Integração Wacom com detecção de pressão

ARQUITETURA:

- Electron: Processo principal para I/O nativo
- React: Interface do usuário
- Fabric.js: Desenho livre e pinceladas
- Konva.js: Formas geométricas e transformações
- Pointer Events API: Captura de input Wacom/mouse/touch

PADRÕES DE CÓDIGO:

- TypeScript strict mode
- Functional components + Hooks
- Custom hooks para lógica reutilizável
- Zustand para state management
- TailwindCSS para estilos

Aplicação desktop multiplataforma (focada em macOS) que replica fielmente o design e funcionalidades do Samsung Notes, com suporte completo para mesas digitalizadoras Wacom.

🎯 Objetivos

Paridade Visual: Interface idêntica ao Samsung Notes
Suporte Wacom: Detecção completa de pressão, inclinação e botões
Performance: Renderização suave mesmo com desenhos complexos
Multiplataforma: Prioridade macOS, mas compatível com Windows/Linux

🛠️ Stack Tecnológica
CamadaTecnologiaPropósitoDesktop FrameworkElectronAplicação nativa multiplataformaUI FrameworkReact 18+Interface de usuárioCanvas EngineFabric.js + Konva.jsRenderização e manipulação de desenhosInput HandlingPointer Events APICaptura de eventos de caneta/mouseLinguagemTypeScriptType safety e melhor DXBuild ToolViteBuild rápido e HMRStylingTailwind CSS + CSS ModulesEstilização responsiva

🏗️ Arquitetura do Sistema
┌─────────────────────────────────────┐
│ Electron Main Process │
│ - Window Management │
│ - File System Access │
│ - Native Menu Integration │
└──────────────┬──────────────────────┘
│ IPC
┌──────────────▼──────────────────────┐
│ Electron Renderer Process │
│ │
│ ┌───────────────────────────────┐ │
│ │ React Application │ │
│ │ │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ UI Components Layer │ │ │
│ │ │ - Toolbar │ │ │
│ │ │ - Sidebar │ │ │
│ │ │ - Note List │ │ │
│ │ └───────────┬─────────────┘ │ │
│ │ │ │ │
│ │ ┌───────────▼─────────────┐ │ │
│ │ │ Canvas Engine Layer │ │ │
│ │ │ - Fabric.js (drawing) │ │ │
│ │ │ - Konva.js (shapes) │ │ │
│ │ └───────────┬─────────────┘ │ │
│ │ │ │ │
│ │ ┌───────────▼─────────────┐ │ │
│ │ │ Input Handler Layer │ │ │
│ │ │ - Pointer Events API │ │ │
│ │ │ - Wacom Driver Bridge │ │ │
│ │ └─────────────────────────┘ │ │
│ └───────────────────────────────┘ │
└─────────────────────────────────────┘

📦 Estrutura de Diretórios
samsung-notes-clone/
├── electron/
│ ├── main.ts # Processo principal do Electron
│ ├── preload.ts # Script de preload seguro
│ └── ipc/ # Handlers IPC
│ ├── file-system.ts
│ └── window-manager.ts
│
├── src/
│ ├── components/ # Componentes React
│ │ ├── Canvas/
│ │ │ ├── DrawingCanvas.tsx
│ │ │ ├── CanvasToolbar.tsx
│ │ │ └── LayerManager.tsx
│ │ ├── Sidebar/
│ │ │ ├── NotesList.tsx
│ │ │ └── FolderTree.tsx
│ │ ├── Toolbar/
│ │ │ ├── MainToolbar.tsx
│ │ │ └── DrawingTools.tsx
│ │ └── Editor/
│ │ ├── TextEditor.tsx
│ │ └── RichTextToolbar.tsx
│ │
│ ├── lib/ # Lógica core
│ │ ├── canvas/
│ │ │ ├── fabric-manager.ts
│ │ │ ├── konva-manager.ts
│ │ │ └── layer-system.ts
│ │ ├── input/
│ │ │ ├── pointer-handler.ts
│ │ │ ├── wacom-detector.ts
│ │ │ └── gesture-recognizer.ts
│ │ ├── storage/
│ │ │ ├── note-storage.ts
│ │ │ ├── serializer.ts
│ │ │ └── indexeddb-manager.ts
│ │ └── tools/
│ │ ├── pen-tool.ts
│ │ ├── eraser-tool.ts
│ │ ├── highlighter-tool.ts
│ │ └── shape-tools.ts
│ │
│ ├── hooks/ # Custom React Hooks
│ │ ├── useCanvas.ts
│ │ ├── useWacomInput.ts
│ │ ├── useNoteStorage.ts
│ │ └── useToolSelection.ts
│ │
│ ├── store/ # State Management (Zustand/Redux)
│ │ ├── canvas-store.ts
│ │ ├── notes-store.ts
│ │ └── ui-store.ts
│ │
│ ├── types/ # TypeScript Definitions
│ │ ├── canvas.d.ts
│ │ ├── note.d.ts
│ │ └── wacom.d.ts
│ │
│ ├── styles/ # Estilos globais
│ │ └── globals.css
│ │
│ ├── App.tsx # Componente raiz
│ └── main.tsx # Entry point React
│
├── public/ # Assets estáticos
│ ├── icons/
│ └── fonts/
│
├── tests/ # Testes
│ ├── unit/
│ ├── integration/
│ └── e2e/
│
├── docs/ # Documentação
│ ├── ARCHITECTURE.md
│ ├── WACOM_INTEGRATION.md
│ └── AI_COLLABORATION.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
├── tailwind.config.js
└── README.md

🎨 Funcionalidades Core (Paridade com Samsung Notes)

1. Sistema de Desenho

Caneta com detecção de pressão (Wacom)
Marcador/Highlighter semitransparente
Borracha (apaga traços completos ou parciais)
Lápis com textura realista
Pincel caligráfico
Cores personalizáveis (paleta Samsung Notes)
Espessuras de traço variáveis

2. Ferramentas de Forma

Linha reta
Círculo/Elipse
Retângulo
Triângulo
Setas
Reconhecimento automático de formas

3. Editor de Texto

Texto rico com formatação
Fontes variadas
Tamanhos e cores
Alinhamento (esquerda, centro, direita)
Listas com bullets e numeração
Checkboxes interativos

4. Gestão de Notas

Criar/Editar/Deletar notas
Pastas e subpastas
Tags e favoritos
Busca full-text
Ordenação por data/nome
Visualização em lista/grid

5. Recursos Avançados

Camadas (layers)
Histórico de Undo/Redo ilimitado
Seleção múltipla de objetos
Transformações (rotação, escala, arrastar)
Exportação (PDF, PNG, JPG)
Sincronização em nuvem (opcional)
Templates de página (linhas, grade, pontilhado)

6. Integração Wacom

Detecção automática de mesa Wacom
Leitura de níveis de pressão (0-1)
Suporte a inclinação da caneta
Mapeamento de botões laterais
Calibração de sensibilidade
Suporte a toque (se disponível)

## Regras Fundamentais

### 1. Test-Driven Development (TDD) Obrigatório

- **NUNCA** implemente uma funcionalidade sem teste
- **NUNCA** considere uma tarefa completa até o teste passar
- **SEMPRE** escreva o teste ANTES do código de implementação

### 2. Ciclo de Desenvolvimento

```
1. Escrever teste (deve FALHAR)
2. Implementar funcionalidade mínima
3. Executar teste
4. Se FALHAR → voltar ao passo 2
5. Se PASSAR → refatorar (se necessário)
6. Executar teste novamente
7. Se PASSAR → tarefa completa ✓
```

## Estrutura de Testes

### Localização

```
tests/
├── unit/
│   ├── tools/
│   │   ├── pen-tool.test.ts
│   │   ├── eraser-tool.test.ts
│   │   └── highlighter-tool.test.ts
│   ├── canvas/
│   │   ├── fabric-manager.test.ts
│   │   └── layer-system.test.ts
│   └── input/
│       ├── pointer-handler.test.ts
│       └── wacom-detector.test.ts
├── integration/
│   ├── canvas-tools.test.ts
│   └── note-storage.test.ts
└── e2e/
    └── drawing-workflow.test.ts
```

## Template de Teste Unitário

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { PenTool } from '@/lib/tools/pen-tool'

describe('PenTool', () => {
  let penTool: PenTool

  beforeEach(() => {
    penTool = new PenTool()
  })

  describe('Pressure Detection', () => {
    it('should apply correct width with 50% pressure', () => {
      const stroke = penTool.createStroke(0.5)
      expect(stroke.width).toBe(2.5)
    })

    it('should apply correct width with 100% pressure', () => {
      const stroke = penTool.createStroke(1.0)
      expect(stroke.width).toBe(5)
    })

    it('should apply correct width with 0% pressure', () => {
      const stroke = penTool.createStroke(0)
      expect(stroke.width).toBe(0)
    })
  })

  describe('Color Application', () => {
    it('should use default black color', () => {
      const stroke = penTool.createStroke(0.5)
      expect(stroke.color).toBe('#000000')
    })

    it('should apply custom color', () => {
      penTool.setColor('#FF0000')
      const stroke = penTool.createStroke(0.5)
      expect(stroke.color).toBe('#FF0000')
    })
  })
})
```

## Template de Teste de Integração

```typescript
import { describe, it, expect } from 'vitest'
import { CanvasManager } from '@/lib/canvas/fabric-manager'
import { PenTool } from '@/lib/tools/pen-tool'

describe('Canvas + PenTool Integration', () => {
  it('should add stroke to canvas', () => {
    const canvas = new CanvasManager()
    const penTool = new PenTool()

    const stroke = penTool.createStroke(0.5)
    canvas.addObject(stroke)

    expect(canvas.getObjects()).toHaveLength(1)
    expect(canvas.getObjects()[0]).toBe(stroke)
  })

  it('should undo last stroke', () => {
    const canvas = new CanvasManager()
    const penTool = new PenTool()

    const stroke = penTool.createStroke(0.5)
    canvas.addObject(stroke)
    canvas.undo()

    expect(canvas.getObjects()).toHaveLength(0)
  })
})
```

## Critérios de Aceitação

### Para Considerar Teste APROVADO

1. **Teste deve executar sem erros**
2. **Todas as asserções devem passar**
3. **Cobertura de código > 80% na funcionalidade**
4. **Testes devem ser determinísticos (não flakey)**
5. **Tempo de execução < 100ms por teste unitário**

### Checklist de Teste

```markdown
- [ ] Teste escrito ANTES da implementação
- [ ] Teste FALHOU inicialmente (Red)
- [ ] Implementação mínima criada
- [ ] Teste PASSOU (Green)
- [ ] Código refatorado (se necessário)
- [ ] Teste ainda PASSA após refatoração
- [ ] Cobertura de edge cases
- [ ] Documentação inline adicionada
```

## Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar testes em watch mode
npm test -- --watch

# Executar testes específicos
npm test pen-tool

# Gerar relatório de cobertura
npm test -- --coverage

# Executar apenas testes unitários
npm test unit

# Executar apenas testes de integração
npm test integration
```

## Cobertura de Código Mínima

```json
{
  "branches": 80,
  "functions": 80,
  "lines": 80,
  "statements": 80
}
```

## Exemplo Completo de Workflow

### Feature: Ferramenta de Caneta com Pressão Wacom

#### 1. Escrever Teste (RED)

```typescript
// tests/unit/tools/pen-tool.test.ts
describe('PenTool - Wacom Pressure', () => {
  it('should create thicker lines with higher pressure', () => {
    const tool = new PenTool()
    const lightStroke = tool.createStroke(0.3)
    const heavyStroke = tool.createStroke(0.9)

    expect(heavyStroke.width).toBeGreaterThan(lightStroke.width)
  })
})
```

**Resultado esperado**: ❌ FALHA (PenTool não existe ainda)

#### 2. Implementar Funcionalidade Mínima (GREEN)

```typescript
// src/lib/tools/pen-tool.ts
export class PenTool {
  private baseWidth = 5

  createStroke(pressure: number) {
    return {
      width: this.baseWidth * pressure,
      color: '#000000'
    }
  }
}
```

**Resultado esperado**: ✅ PASSA

#### 3. Refatorar (se necessário)

```typescript
// src/lib/tools/pen-tool.ts
export class PenTool {
  private baseWidth = 5
  private color = '#000000'

  createStroke(pressure: number) {
    return {
      width: this.calculateWidth(pressure),
      color: this.color
    }
  }

  private calculateWidth(pressure: number): number {
    return this.baseWidth * Math.max(0, Math.min(1, pressure))
  }

  setColor(color: string) {
    this.color = color
  }
}
```

**Resultado esperado**: ✅ AINDA PASSA

#### 4. Adicionar Testes para Edge Cases

```typescript
describe('PenTool - Edge Cases', () => {
  it('should handle negative pressure', () => {
    const tool = new PenTool()
    const stroke = tool.createStroke(-0.5)
    expect(stroke.width).toBe(0)
  })

  it('should handle pressure > 1', () => {
    const tool = new PenTool()
    const stroke = tool.createStroke(1.5)
    expect(stroke.width).toBe(5)
  })
})
```

**Resultado esperado**: ✅ TODOS PASSAM

## Protocolo de Colaboração com IA

### Ao Solicitar Nova Funcionalidade

```markdown
FEATURE: [Nome da Feature]

TESTE OBRIGATÓRIO:

- Escreva o teste ANTES da implementação
- O teste deve FALHAR inicialmente
- A implementação deve fazer o teste PASSAR
- TODAS as asserções devem passar
- Cobertura mínima: 80%

CRITÉRIO DE PARADA:
A IA só deve considerar a tarefa completa quando:

1. Todos os testes PASSAREM (✅)
2. Cobertura de código atingida
3. Nenhum teste flakey
```

### Resposta Esperada da IA

```markdown
✅ IMPLEMENTAÇÃO COMPLETA

TESTES:

- ✅ pen-tool.test.ts (5 testes passando)
- ✅ Cobertura: 95% (19/20 linhas)
- ✅ Tempo de execução: 45ms

ARQUIVOS CRIADOS/MODIFICADOS:

- tests/unit/tools/pen-tool.test.ts (novo)
- src/lib/tools/pen-tool.ts (novo)
- src/types/tools.d.ts (modificado)

PRÓXIMOS PASSOS:
[feature seguinte]
```

## Ferramentas de Teste

### Vitest (Unit/Integration)

```bash
npm i -D vitest @vitest/ui
```

### Playwright (E2E)

```bash
npm i -D @playwright/test
```

### Coverage

```bash
npm i -D @vitest/coverage-v8
```

## Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
})
```

## Falhas Comuns a Evitar

❌ **Implementar antes do teste**
❌ **Marcar como completo com testes falhando**
❌ **Ignorar testes quebrados**
❌ **Mockar demais (over-mocking)**
❌ **Testes dependentes de ordem de execução**
❌ **Testes sem asserções**

## Mantra do Desenvolvedor

```
RED → GREEN → REFACTOR → REPEAT

Sem teste verde = Sem código em produção
```
