# Análise do Design System - Status Atual

## Problema Identificado

Os componentes estão usando **cores hardcoded (hex)** diretamente nos componentes ao invés de usar os **tokens do design system** definidos no `globals.css`.

## Situação Atual

### ✅ O que está correto:
- `globals.css` tem tokens básicos definidos em OKLCH
- `tailwind.config.ts` está configurado para sidebar
- Tipografia está usando Inter corretamente

### ❌ O que precisa ser corrigido:
- Componentes usam cores hex (`#191e3b`, `#fddb32`, etc.) ao invés de tokens
- Cores do Figma não estão mapeadas como tokens no `globals.css`
- `tailwind.config.ts` não tem as cores customizadas do Figma

## Cores do Figma em Uso (Hardcoded)

### Cores de Texto:
- `#191e3b` - Texto principal (deveria ser `foreground`)
- `#4b5173` - Texto secundário (deveria ser `muted-foreground`)
- `#7a7fa3` - Texto terciário (precisa token customizado)
- `#0a0a0a` - Texto escuro (precisa token customizado)

### Cores de Fundo:
- `#f1f3f9` - Fundo secundário (deveria ser `muted`)
- `#fff7d6` - Amarelo claro (precisa token customizado)
- `#fff9e3` - Amarelo muito claro (precisa token customizado)
- `white` - Fundo branco (deveria ser `card` ou `background`)

### Cores de Borda:
- `#e6e9f2` - Borda padrão (deveria ser `border`)

### Cores Primárias:
- `#fddb32` - Amarelo primário (precisa token customizado: `--brand-yellow`)
- `#546dfa` - Azul primário/links (precisa token customizado: `--brand-blue`)

### Cores de Status:
- `#fdecec` / `#9b2c2c` - Erro/Cancelado (deveria usar `destructive`)
- `#fff2d6` / `#8a6a1f` - Warning/Atraso (precisa token customizado)
- `#eaf7f0` / `#2e7d5b` - Sucesso/Confirmado (precisa token customizado)
- `#ef4444` - Vermelho (deveria ser `destructive`)

## Solução Recomendada

1. **Adicionar tokens customizados no `globals.css`** para cores específicas do Figma
2. **Atualizar `tailwind.config.ts`** para expor essas cores como classes Tailwind
3. **Migrar componentes gradualmente** para usar os tokens ao invés de hex

## Próximos Passos

Ver arquivo `DESIGN_SYSTEM_TOKENS_UPDATE.md` para a implementação completa.

