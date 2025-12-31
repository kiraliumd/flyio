# Status do Design System - Análise Completa

## ✅ Resumo da Situação

### Arquivos Atualizados:
1. **`app/globals.css`** ✅ - Agora contém tokens customizados do Figma
2. **`tailwind.config.ts`** ✅ - Agora expõe as cores como classes Tailwind

### Situação dos Componentes:
❌ **Componentes ainda usam cores hardcoded** - Precisam ser migrados gradualmente

## 📋 Mapeamento de Cores: Hex → Tokens

### Antes (Hardcoded) → Depois (Token)

| Hex Atual | Token Novo | Uso |
|-----------|------------|-----|
| `#191e3b` | `text-primary` | Texto principal |
| `#4b5173` | `text-secondary` | Texto secundário |
| `#7a7fa3` | `text-tertiary` | Texto terciário |
| `#0a0a0a` | `text-dark` | Texto escuro |
| `#fddb32` | `brand-yellow` | Amarelo primário |
| `#fff7d6` | `brand-yellow-light` | Amarelo claro |
| `#fff9e3` | `brand-yellow-lighter` | Amarelo muito claro |
| `#546dfa` | `brand-blue` | Azul primário/links |
| `#e6e9f2` | `border-default` | Borda padrão |
| `#f1f3f9` | `bg-secondary` | Fundo secundário |
| `#fdecec` | `status-error-bg` | Fundo erro |
| `#9b2c2c` | `status-error-text` | Texto erro |
| `#fff2d6` | `status-warning-bg` | Fundo warning |
| `#8a6a1f` | `status-warning-text` | Texto warning |
| `#eaf7f0` | `status-success-bg` | Fundo sucesso |
| `#2e7d5b` | `status-success-text` | Texto sucesso |

## 🎯 Como Usar os Novos Tokens

### Exemplo de Migração:

**Antes:**
```tsx
<p className="text-[#191e3b]">Texto</p>
<div className="bg-[#fddb32]">Botão</div>
<div className="border border-[#e6e9f2]">Card</div>
```

**Depois:**
```tsx
<p className="text-text-primary">Texto</p>
<div className="bg-brand-yellow">Botão</div>
<div className="border border-default">Card</div>
```

## 📊 Status por Arquivo

### Componentes que Precisam Migração:

1. **`app/dashboard/page.tsx`** - ~30 ocorrências de hex
2. **`app/dashboard/flights/flights-client.tsx`** - ~25 ocorrências
3. **`components/app-sidebar.tsx`** - ~10 ocorrências
4. **`app/login/page.tsx`** - ~10 ocorrências
5. **`app/onboarding/*`** - ~15 ocorrências
6. **Outros componentes** - ~20 ocorrências

**Total estimado:** ~110 ocorrências de cores hex que podem ser migradas para tokens

## 🔄 Próximos Passos Recomendados

1. ✅ **Concluído:** Tokens adicionados ao `globals.css`
2. ✅ **Concluído:** Tokens expostos no `tailwind.config.ts`
3. ⏳ **Pendente:** Migrar componentes gradualmente
4. ⏳ **Pendente:** Atualizar documentação

## 💡 Recomendação

**Não é necessário migrar tudo de uma vez.** Os tokens estão disponíveis e podem ser usados em:
- Novos componentes
- Refatorações futuras
- Componentes críticos primeiro

Os componentes atuais continuam funcionando com cores hex, mas agora há uma base sólida para migração gradual.

