# 🎮 JSConf España 2026 — Sopla el Cartucho

<p align="center">
  <a href="https://0GiS0.github.io/jsconf-2026"><img src="https://img.shields.io/badge/🌐_Web-GitHub_Pages-brightgreen?style=for-the-badge" alt="GitHub Pages"></a>
  <a href="https://www.youtube.com/c/GiselaTorres?sub_confirmation=1"><img src="https://img.shields.io/youtube/channel/subscribers/UC140iBrEZbOtvxWsJ-Tb0lQ?style=for-the-badge&logo=youtube&logoColor=white&color=red" alt="YouTube"></a>
  <a href="https://github.com/0GiS0"><img src="https://img.shields.io/github/followers/0GiS0?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.linkedin.com/in/giselatorresbuitrago/"><img src="https://img.shields.io/badge/LinkedIn-Sígueme-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
  <a href="https://twitter.com/0GiS0"><img src="https://img.shields.io/badge/X-Sígueme-black?style=for-the-badge&logo=x&logoColor=white" alt="X"></a>
</p>

---

¡Hola developer 👋🏻! Este es el repositorio de mi charla en la **JSConf España 2026**. La IA ha pasado de autocompletar líneas a currar contigo. En esta charla te muestro cómo usar agentes e IA para montar apps con Astro, Vue o tu framework frontend favorito, y hacer que programar pueda ser (todavía más) divertido.

El resultado es **"Sopla el Cartucho"**: una web con estilo retro inspirada en la **Game Boy** y los cartuchos clásicos de los años 90, ¡construida en vivo con ayuda de agentes de IA!

## 📸 Diseño actual

<p align="center">
  <img src="docs/screenshots/demo.gif" alt="Demo de Sopla el Cartucho" />
</p>

🌐 **Web publicada:** [https://0GiS0.github.io/jsconf-2026](https://0GiS0.github.io/jsconf-2026)

## ✨ Características

- 🎮 **Diseño retro Game Boy** — Interfaz nostálgica con estética pixel art
- 📼 **Cartuchos de charlas** — Cada speaker tiene su propio cartucho personalizado
- 🍄 **Break cartridges** — Descansos estilizados como power-ups de Mario
- 🖼️ **Avatares 8-bit** — Generados automáticamente para cada speaker mediante un pipeline determinista
- 📱 **Responsive** — Funciona en desktop y móvil
- 🔗 **QR Code** — Para compartir fácilmente en el evento

## 🚀 Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Astro](https://astro.build/) | Framework web estático (SSG) |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático en todo el proyecto |
| [Sharp](https://sharp.pixelplumbing.com/) | Pipeline de generación de assets pixel art |
| CSS Custom Properties | Theming retro sin dependencias externas |

### 🖼️ Pixel art pipeline

Los avatares y portadas de los cartuchos se generan automáticamente con un pipeline determinista basado en **Sharp**:

1. Se descarga la foto del speaker desde la agenda.
2. Se aplican filtros de posterización y paleta reducida (estilo 8-bit).
3. Se genera una imagen pixelada lista para usar en la web.

Así cada speaker tiene su avatar único sin necesidad de editarlo a mano.

## 🛠️ Instalación y desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/0GiS0/jsconf-2026.git
cd jsconf-2026

# Instalar dependencias (requiere Node.js >= 18)
npm install

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:4321

# Generar assets (avatares 8-bit y portadas de cartuchos)
npm run generate:all

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

## 📁 Estructura del proyecto

```
src/
├── components/     # Componentes Astro
│   ├── Console.astro        # Consola Game Boy CSS
│   ├── CartridgeCard.astro  # Cartucho de charla
│   └── BreakCartridge.astro # Cartucho de descanso
├── data/           # Datos de charlas y assets
├── layouts/        # Layouts base
├── lib/            # Utilidades y helpers
├── pages/          # Páginas de la web
└── styles/         # Estilos globales
scripts/
├── fetch-agenda.ts      # Descarga la agenda del evento
├── generate-assets.ts   # Genera avatares 8-bit
└── generate-covers.ts   # Genera portadas de cartuchos
```

## 🎨 Créditos de diseño (CodePen)

El diseño retro se basa en trabajos publicados en CodePen bajo licencia MIT:

| Componente | Autor | Enlace |
|---|---|---|
| Game Boy CSS art (`Console.astro`) | Brandon | [codepen.io/brundolf/pen/beagbQ](https://codepen.io/brundolf/pen/beagbQ) |
| Game Boy cartridge (`CartridgeCard.astro`) | Van Huynh | [codepen.io/worksbyvan/pen/MoxroE](https://codepen.io/worksbyvan/pen/MoxroE) |

## 🌐 Sígueme en mis redes sociales

Si te ha gustado este proyecto y quieres ver más contenido como este, no olvides suscribirte a mi canal de YouTube y seguirme en mis redes sociales:

<p align="center">
  <a href="https://www.youtube.com/c/GiselaTorres?sub_confirmation=1"><img src="https://img.shields.io/youtube/channel/subscribers/UC140iBrEZbOtvxWsJ-Tb0lQ?style=for-the-badge&logo=youtube&logoColor=white&color=red" alt="YouTube Channel Subscribers"></a>
  <a href="https://github.com/0GiS0"><img src="https://img.shields.io/github/followers/0GiS0?style=for-the-badge&logo=github&logoColor=white" alt="GitHub followers"></a>
  <a href="https://www.linkedin.com/in/giselatorresbuitrago/"><img src="https://img.shields.io/badge/LinkedIn-Sígueme-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Follow"></a>
  <a href="https://twitter.com/0GiS0"><img src="https://img.shields.io/badge/X-Sígueme-black?style=for-the-badge&logo=x&logoColor=white" alt="X Follow"></a>
</p>

## 📄 Licencia

El código fuente de este proyecto está bajo la licencia **MIT** — ver el archivo [LICENSE](LICENSE) para más detalles.

Los créditos de diseño pertenecen a sus autores originales (ver sección [Créditos de diseño](#-créditos-de-diseño-codepen)).
