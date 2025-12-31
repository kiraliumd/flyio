# Design Tokens - Referência Rápida

Este documento fornece uma referência rápida dos tokens de design do projeto, mapeados do Figma para o código.

## Tipografia

### Font Family
- **Figma:** `family/sans` = "Inter"
- **Código:** `Inter` (importado do Google Fonts em `app/layout.tsx`)
- **Uso:** `font-sans` ou `className={inter.className}`

### Tamanhos de Texto

| Figma Token | Tamanho | Tailwind Class | Uso |
|------------|---------|---------------|-----|
| `size/xs` | 12px | `text-xs` | Textos pequenos, labels |
| - | 14px | `text-sm` | Textos secundários |
| - | 16px | `text-base` | Texto padrão |
| - | 18px | `text-lg` | Subtítulos |
| - | 20px | `text-xl` | Títulos menores |
| - | 24px | `text-2xl` | Títulos médios |
| - | 30px | `text-3xl` | Títulos grandes |

### Line Height

| Figma Token | Valor | Tailwind Class | Uso |
|------------|-------|---------------|-----|
| `leading/4` | 16px | `leading-4` | Para text-xs (12px) |
| - | 20px | `leading-5` | Para text-sm (14px) |
| - | 24px | `leading-6` | Para text-base (16px) |
| - | - | `leading-tight` | Títulos compactos |
| - | - | `leading-normal` | Texto padrão |
| - | - | `leading-relaxed` | Texto espaçado |

### Font Weight

| Figma Token | Valor | Tailwind Class | Uso |
|------------|-------|---------------|-----|
| `weight/normal` | 400 | `font-normal` | Texto padrão |
| - | 500 | `font-medium` | Ênfase média |
| - | 600 | `font-semibold` | Subtítulos |
| - | 700 | `font-bold` | Títulos |

### Letter Spacing

| Figma Token | Valor | Tailwind Class | Uso |
|------------|-------|---------------|-----|
| `tracking/normal` | 0px | `tracking-normal` | Texto padrão |
| - | -0.025em | `tracking-tight` | Títulos compactos |
| - | 0.025em | `tracking-wide` | Títulos espaçados |

### Exemplo Completo (Text-xs/Regular do Figma)

```tsx
// Figma: Text-xs/Regular
// Font: Inter, 12px, weight 400, line-height 16px, letter-spacing 0px
<p className="text-xs font-normal leading-4 tracking-normal">
  Suporte
</p>
```

## Cores

### Cores Principais

| Token CSS | Valor OKLCH | Uso |
|----------|-------------|-----|
| `--background` | `oklch(0.97 0.007 234)` | Fundo principal |
| `--foreground` | `oklch(0.21 0.036 256)` | Texto principal |
| `--primary` | `oklch(0.27 0.035 249)` | Cor primária |
| `--primary-foreground` | `oklch(1 0 0)` | Texto sobre primária |
| `--secondary` | `oklch(0.55 0.040 247 / 0.075)` | Cor secundária |
| `--muted` | `oklch(0.92 0.014 248)` | Fundo muted |
| `--accent` | `oklch(0.98 0.003 248)` | Cor de destaque |
| `--destructive` | `oklch(0.808 0.114 19.571)` | Erro/destrutivo |
| `--border` | `oklch(0.27 0.035 249 / 0.125)` | Bordas |
| `--ring` | `oklch(0.27 0.035 249)` | Anel de foco |

### Uso no Código

```tsx
// Background
<div className="bg-background">

// Texto
<p className="text-foreground">

// Botão primário
<Button className="bg-primary text-primary-foreground">

// Borda
<div className="border border-border">
```

## Espaçamento

### Gap (Espaçamento entre elementos)

| Valor | Tailwind | Uso |
|-------|----------|-----|
| 8px | `gap-2` | Espaçamento pequeno |
| 16px | `gap-4` | Espaçamento padrão |
| 24px | `gap-6` | Espaçamento grande |
| 32px | `gap-8` | Espaçamento extra grande |

### Padding

| Valor | Tailwind | Uso |
|-------|----------|-----|
| 16px | `p-4` | Padding pequeno |
| 24px | `p-6` | Padding padrão (Cards) |
| 32px | `p-8` | Padding grande |

### Margin/Spacing Vertical

| Valor | Tailwind | Uso |
|-------|----------|-----|
| 16px | `space-y-4` | Espaçamento vertical padrão |
| 24px | `space-y-6` | Espaçamento vertical grande |

## Border Radius

| Token CSS | Valor | Tailwind | Uso |
|-----------|-------|----------|-----|
| `--radius` | 0.5rem (8px) | `rounded-lg` | Padrão |
| - | 6px | `rounded-md` | Médio |
| - | 12px | `rounded-xl` | Cards |

## Componentes Comuns

### Button

```tsx
// Variantes
<Button variant="default">Padrão</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destrutivo</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
</Card>
```

### Badge

```tsx
<Badge variant="default">Padrão</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="secondary">Secundário</Badge>
```

## Ícones

### Biblioteca: Hugeicons

```tsx
import { HugeiconsIcon } from '@hugeicons/react'
import { Airplane01Icon } from '@hugeicons/core-free-icons'

// Tamanhos padrão
<HugeiconsIcon icon={Airplane01Icon} className="size-4" />  // 16px
<HugeiconsIcon icon={Airplane01Icon} className="size-6" />  // 24px
<HugeiconsIcon icon={Airplane01Icon} className="size-8" />   // 32px

// Com cor
<HugeiconsIcon icon={Airplane01Icon} className="size-4 text-blue-600" />
```

## Responsividade

### Breakpoints

| Breakpoint | Tamanho | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile grande |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Desktop extra grande |

### Exemplo

```tsx
// 1 coluna no mobile, 3 colunas no desktop
<div className="grid gap-4 md:grid-cols-3">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</div>
```

## Mapeamento Figma → Código

Quando você obtém tokens do Figma via MCP:

1. **family/sans** → Já configurado como `Inter` no `layout.tsx`
2. **size/xs** → Use `text-xs` (12px)
3. **leading/4** → Use `leading-4` (16px)
4. **weight/normal** → Use `font-normal` (400)
5. **tracking/normal** → Use `tracking-normal` (0px)

### Exemplo de Conversão

**Figma:**
```
Text-xs/Regular
Font: family/sans (Inter)
Size: size/xs (12px)
Weight: weight/normal (400)
Line Height: leading/4 (16px)
Letter Spacing: tracking/normal (0px)
```

**Código:**
```tsx
<p className="text-xs font-normal leading-4 tracking-normal text-foreground">
  Texto
</p>
```

