---
description: "Prueba la app en resoluciones móviles usando el navegador Chrome MCP"
agent: "agent"
tools: ['io.github.chromedevtools/chrome-devtools-mcp/*']
---

Prueba la aplicación web en resoluciones móviles reales usando el MCP de Chrome.

## Pasos

1. **Emular viewport mobile** con `mcp_io_github_chr_emulate` usando las resoluciones indicadas abajo.
2. **Navegar** a la URL del servidor de desarrollo con `mcp_io_github_chr_navigate_page`.
3. **Tomar screenshot** con `mcp_io_github_chr_take_screenshot`.
4. **Evaluar scripts** con `mcp_io_github_chr_evaluate_script` para comprobar estilos computados si hay dudas.
5. **Reportar** los problemas encontrados con capturas.

## Dispositivos a probar

| Dispositivo            | Viewport         | Scale | Orientación |
|------------------------|------------------|-------|-------------|
| iPhone 15 Pro          | 393x852x3        | 3     | Portrait    |
| iPhone 15 Pro Max      | 430x932x3        | 3     | Portrait    |
| iPhone 15 Pro Max (L)  | 932x430x3        | 3     | Landscape   |
| Samsung Galaxy S24     | 360x780x3        | 3     | Portrait    |
| iPad Mini              | 768x1024x2       | 2     | Portrait    |

Formato del parámetro `viewport`: `{width}x{height}x{scale},mobile,touch`

## Qué verificar

- Elementos que deberían ocultarse en mobile (ej: QR codes)
- Overflow horizontal o elementos que se salen de la pantalla
- Texto legible y botones con tamaño táctil adecuado (mínimo 44x44px)
- Scroll automático y navegación correcta
- Layout responsive: grid, flex, columnas

Responde siempre en **español**.
