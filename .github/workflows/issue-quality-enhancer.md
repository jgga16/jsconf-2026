---
on:
  issues:
    types: [opened]

permissions:
  issues: read

safe-outputs:
  update-issue:
    title:
    body:

tools:
  github:
    toolsets: [issues]

mcp-servers:
  tavily:
    command: npx
    args: ["-y", "@tavily/mcp-server"]
    env:
      TAVILY_API_KEY: "${{ secrets.TAVILY_API_KEY }}"
    allowed: ["search"]

network:
  allowed:
    - defaults
    - "*.tavily.com"
---

# Mejorador de Issues

Mejora automáticamente los issues nuevos para que sean claros, estén bien estructurados y sean fáciles de entender. Además, busca referencias relevantes en la web para enriquecer el contexto.

## Issue a mejorar

| Campo  | Valor          |
| ------ | -------------- |
| Número | #$ISSUE_NUMBER |
| Autor  | @$ISSUE_AUTHOR |
| Título | $ISSUE_TITLE   |
| Cuerpo | $ISSUE_BODY    |

## Tus tareas

### 1. Obtener contexto

- Lee el README para entender el proyecto (es una web estilo Game Boy retro para JSConf España 2026)
- Lista las etiquetas del repositorio (las necesitarás después)

### 2. Buscar referencias relevantes

Usa la herramienta `search` de Tavily para encontrar información útil relacionada con el issue:

- Busca artículos, documentación o recursos que puedan ayudar a resolver o entender mejor el problema
- Enfócate en tecnologías mencionadas en el issue (Astro, TypeScript, CSS, etc.)
- Si es un bug, busca soluciones conocidas o issues similares en otros proyectos
- Si es una mejora, busca ejemplos de implementaciones o buenas prácticas

**Formato de las referencias encontradas:**

```markdown
## 🔗 Referencias útiles
- [Título del recurso](URL) - Breve descripción de por qué es relevante
```

> ⚠️ Solo incluye referencias si son realmente útiles para el issue. No añadas enlaces genéricos.

### 3. Mejorar el título

Añade un emoji como prefijo según el tipo de issue:

- 🐛 Bug (algo no funciona)
- ✨ Enhancement (nueva mejora o funcionalidad)
- 📝 Documentation (documentación, README)
- ❓ Question (pregunta o duda)
- 🕹️ Retro-UI (interfaz y estética del sitio)
- 🖼️ Covers (carátulas y composición visual)
- 👤 Avatars (avatares y pixel-art)
- 📅 Agenda-data (datos de la agenda)
- ⚙️ Build-pipeline (scripts y automatización)

Ejemplo: `🐛 Error al cargar el avatar del speaker`

### 4. Reestructurar el cuerpo

Usa secciones claras con encabezados emoji.

**Para bugs:**

```markdown
## 🐛 Descripción
(Qué está fallando)

## 📋 Pasos para reproducir
1. ...
2. ...
3. ...

## ✅ Comportamiento esperado
(Qué debería pasar)

## ❌ Comportamiento actual
(Qué pasa realmente)

## 📸 Capturas (si aplica)
(Imágenes o GIFs del problema)

## 🔗 Referencias útiles
(Enlaces encontrados en la búsqueda que puedan ayudar a resolver el bug)
```

**Para mejoras/features:**

```markdown
## ✨ Descripción
(Qué se quiere añadir o mejorar)

## 🎯 ¿Por qué es necesario?
(Contexto y motivación)

## 📐 Solución propuesta
(Cómo se podría implementar)

## 🔗 Referencias útiles
(Enlaces a ejemplos, documentación o implementaciones similares)

## 📝 Notas adicionales
(Cualquier otra información relevante)
```

**Para documentación:**

```markdown
## 📝 Descripción
(Qué documentación falta o hay que mejorar)

## 📍 Ubicación
(Dónde debería estar la documentación)

## ✏️ Contenido sugerido
(Qué debería incluir)

## 🔗 Referencias útiles
(Documentación de referencia o ejemplos de otros proyectos)
```

### 5. Añadir pie de página

```markdown
---
> 🤖 *Issue mejorado automáticamente por Copilot. Autor original: @$ISSUE_AUTHOR*
```

### 6. Aplicar cambios

- **Actualiza** el issue #$ISSUE_NUMBER con el nuevo título y cuerpo
- **Asigna** 1-3 etiquetas relevantes de las disponibles en el repositorio
- **Comenta** con un breve resumen de las mejoras realizadas (en español)

## Reglas

- Nunca cambies el significado original del issue
- Si el issue ya está bien escrito, haz cambios mínimos
- Mantén el contenido útil, no verboso
- Todo el contenido debe estar en español
- Respeta el estilo retro/gaming del proyecto en los comentarios
