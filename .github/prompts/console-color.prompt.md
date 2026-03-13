---
name: console-color
description: Prompt para probar diferentes colores para la consola
agent: agent
model: GPT-5.4 (copilot)
tools: [execute/getTerminalOutput, execute/awaitTerminal, execute/killTerminal, execute/runTask, execute/createAndRunTask, execute/runInTerminal, read, agent, browser, edit/editFiles, search, todo]
---

## Objetivo
Probar diferentes colores para la consola y describir el resultado visual de cada uno.

## Pasos a seguir

### 1. Arrancar el servidor de desarrollo
- Ejecuta `npm run dev` en segundo plano (background).
- **Espera a que el servidor arranque** y navega a  http://localhost:4321/jsconf-2026

### 2. Abrir el navegador
- Usa el navegador integrado para navegar a la URL que indicó el servidor.
- Haz una captura de pantalla para verificar que la aplicación carga correctamente.

### 3. Encender la consola
- Antes de cambiar colores, **enciende la consola** haciendo clic en el botón de encendido.
- Haz una captura de pantalla para confirmar que está encendida.

### 4. Verificar el control de color
- Comprueba si existe un control visible en la interfaz para cambiar el color de la consola.
- **No modifiques código ni estilos** para simular el cambio de color.
- Si el control no existe o no funciona, detén la prueba de colores y repórtalo como bloqueo.

### 5. Probar los colores
Prueba los siguientes colores uno por uno:
1. **Verde**
2. **Rojo**
3. **Azul**
4. **Amarillo**

Para cada color:
- Cambia el color de la consola usando la interfaz real.
- Haz una captura de pantalla.
- Describe cómo se ve: ¿es vibrante, apagado, tiene algún efecto visual interesante?

### 6. Conclusión
- Indica cuál color te gustó más y por qué.
- Resume brevemente las diferencias visuales entre los colores probados.
- Si hubo bloqueo, explica exactamente en qué paso ocurrió.
