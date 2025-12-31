# Guia de Integração com Figma

Este guia explica como usar o MCP do Figma para obter contexto de design e atualizar o design system do projeto.

## Pré-requisitos

1. Ter o Figma Desktop instalado e aberto
2. Ter o arquivo de design do projeto aberto no Figma
3. Ter o MCP do Figma configurado no Cursor

## Processo de Obtenção de Contexto

### Passo 1: Selecionar a Tela no Figma

1. Abra o arquivo de design no Figma Desktop
2. Selecione o frame/componente da tela que deseja analisar
3. Certifique-se de que o elemento está selecionado (borda azul ao redor)

### Passo 2: Obter Design Context

O MCP do Figma fornece várias ferramentas:

#### `get_design_context`
Obtém o código React/Tailwind gerado a partir do design selecionado.

**Uso:**
- Selecione um nó no Figma
- O MCP retornará código React com classes Tailwind
- **IMPORTANTE:** O código precisa ser convertido para seguir os padrões do projeto

#### `get_variable_defs`
Obtém as definições de variáveis de design (cores, tipografia, espaçamento).

**Exemplo de retorno:**
```json
{
  "tracking/normal": "0",
  "size/xs": "12",
  "family/sans": "Inter",
  "leading/4": "16",
  "weight/normal": "400"
}
```

#### `get_screenshot`
Obtém uma captura de tela do elemento selecionado para referência visual.

### Passo 3: Mapear Tokens do Figma para o Código

Use a tabela de mapeamento em `DESIGN_TOKENS.md`:

| Figma Token | Código |
|-------------|--------|
| `family/sans` | `Inter` (já configurado) |
| `size/xs` | `text-xs` |
| `leading/4` | `leading-4` |
| `weight/normal` | `font-normal` |
| `tracking/normal` | `tracking-normal` |

### Passo 4: Atualizar Componentes

1. Analise o código gerado pelo Figma
2. Converta para seguir os padrões do projeto:
   - Use componentes do shadcn/ui quando possível
   - Use classes Tailwind que referenciam variáveis CSS
   - Mantenha a estrutura de componentes existente
   - Siga os padrões de naming do projeto

## Exemplo Prático

### Cenário: Atualizar Tela de Login

1. **No Figma:**
   - Selecione o frame da tela de login
   - Anote os tokens de design visíveis

2. **Obter Contexto:**
   ```
   - get_design_context (retorna código React)
   - get_variable_defs (retorna tokens)
   - get_screenshot (retorna imagem de referência)
   ```

3. **Mapear Tokens:**
   - Se o Figma mostra `Text-xs/Regular`, use:
     ```tsx
     <p className="text-xs font-normal leading-4 tracking-normal">
     ```

4. **Atualizar Componente:**
   - Abra `app/login/page.tsx`
   - Compare com o design do Figma
   - Atualize classes Tailwind e estrutura conforme necessário
   - Mantenha a lógica existente (hooks, handlers, etc.)

## Telas Principais do Projeto

### 1. Login (`app/login/page.tsx`)
- Componente: `AuthLayout`
- Elementos principais: Título, subtítulo, botão Google, footer

### 2. Dashboard (`app/dashboard/page.tsx`)
- Componentes: Cards de métricas, widget de inteligência jurídica
- Elementos principais: Cards, badges, ícones, links

### 3. Lista de Voos (`app/dashboard/flights/page.tsx`)
- Componentes: Tabela de voos, botão de adicionar
- Elementos principais: Tabela, badges de status, ações

### 4. Onboarding (`app/onboarding/page.tsx`)
- Componente: `OnboardingForm`
- Elementos principais: Formulário, inputs, botões

## Dicas e Boas Práticas

### ✅ Faça

1. **Sempre obtenha screenshot** para referência visual
2. **Mapeie tokens do Figma** antes de escrever código
3. **Use componentes existentes** do shadcn/ui quando possível
4. **Mantenha a lógica** existente, apenas atualize o visual
5. **Teste responsividade** após atualizações
6. **Documente mudanças** significativas no design system

### ❌ Evite

1. **Não copie código diretamente** do Figma sem adaptar
2. **Não quebre a estrutura** de componentes existente
3. **Não ignore tokens** definidos no Figma
4. **Não use cores hardcoded**, sempre use variáveis CSS
5. **Não esqueça do dark mode** ao atualizar cores

## Comandos Úteis

### Para obter contexto de uma tela específica:

1. Selecione o frame no Figma
2. Use o MCP do Figma para obter:
   - Design context
   - Variable definitions
   - Screenshot

### Para atualizar tokens globais:

1. Se novas cores forem definidas no Figma:
   - Adicione em `app/globals.css` no formato OKLCH
   - Atualize variáveis de dark mode também

2. Se novos tamanhos de texto forem definidos:
   - Verifique se já existe no Tailwind
   - Se não, adicione em `tailwind.config.ts` se necessário

## Troubleshooting

### Problema: MCP não retorna dados
**Solução:** Certifique-se de que:
- O Figma Desktop está aberto
- Um elemento está selecionado no Figma
- O MCP está configurado corretamente

### Problema: Código do Figma não segue padrões do projeto
**Solução:** 
- Use o código como referência visual
- Converta manualmente seguindo os padrões do projeto
- Consulte `design_system_rules.mdc` para padrões

### Problema: Tokens do Figma não batem com o código
**Solução:**
- Verifique o mapeamento em `DESIGN_TOKENS.md`
- Atualize tokens se necessário
- Documente novas convenções

## Recursos

- **Design System Rules:** `.cursor/rules/design_system_rules.mdc`
- **Design Tokens Reference:** `DESIGN_TOKENS.md`
- **Componentes UI:** `components/ui/`
- **Estilos Globais:** `app/globals.css`

