# Sistema de Imágenes y Skins

## Estructura de carpetas

```
public/
  images/
    skins/
      default-masculino.png
      default-femenino.png
      tigre-masculino.png
      tigre-femenino.png
      dragon-masculino.png
      dragon-femenino.png
      grulla-masculino.png
      grulla-femenino.png
      sombra-masculino.png
      sombra-femenino.png
      loto-masculino.png
      loto-femenino.png
```

## Formato requerido

| Propiedad | Valor |
|-----------|-------|
| **Formato** | PNG con transparencia (alpha channel) |
| **Tamaño** | 1024×1024px (cuadrado 1:1) |
| **Personaje** | Cuerpo completo centrado, de frente, pose neutra |
| **Fondo** | Transparente (sin fondo) |
| **Estilo** | Cartoon / cel-shaded, líneas negras de contorno, colores planos |

## Nomenclatura

```
{nombre-skin}-{genero}.png
```

- `{nombre-skin}`: nombre en minúsculas y sin espacios (ej: `default`, `tigre`, `dragon`)
- `{genero}`: `masculino` o `femenino`

**Ejemplos:** `default-masculino.png`, `tigre-femenino.png`

## Skins disponibles

| Skin | Temática |
|------|----------|
| `default` | Monje clásico (toga café) |
| `tigre` | Felino feroz (naranja/rayas negras) |
| `dragon` | Poder místico (verde/dorado) |
| `grulla` | Elegancia (blanco/azul) |
| `sombra` | Sigilo (negro/gris) |
| `loto` | Divinidad (blanco/dorado) |

## Cómo generar assets con Leonardo AI

### Configuración en Leonardo AI

- **Modelo:** Leonardo Kino XL o similar cartoon
- **Tamaño:** 1024×1024
- **Formato:** PNG
- **Background:** No Background o quitar fondo después con Photoroom / remove.bg
- **Steps:** 30-50
- **Guidance Scale:** 7-10

### Prompt base

> Full-body character design of a [GENERO] shaolin martial arts [TEMA], cartoon style, cel-shaded, flat colors with clean black outlines. Centered on transparent background, square 1:1 crop, no background. Neutral standing pose, front-facing. [DESCRIPCION_VESTIMENTA]. Inspired by Avatar The Last Airbender mixed with modern mobile game characters. 2D flat shading, high resolution 1024x1024.

Reemplazar:

| Variable | Valor |
|----------|-------|
| `[GENERO]` | `male` o `female` |
| `[TEMA]` | `monk`, `tiger warrior`, `dragon warrior`, `crane warrior`, `shadow warrior`, `lotus monk` |
| `[DESCRIPCION_VESTIMENTA]` | Ver prompts específicos abajo |

### Prompts por skin

**Default masculino:**
> Full-body character design of a male shaolin martial arts monk, cartoon style, cel-shaded, flat colors with clean black outlines. Centered on transparent background, square 1:1 crop, no background. Neutral standing pose, front-facing. Beige-brown traditional monk robes, barefoot, simple cloth belt, shaved head, calm but ready expression. Inspired by Avatar The Last Airbender mixed with modern mobile game characters. 2D flat shading, high resolution 1024x1024.

**Default femenino:**
> Full-body character design of a female shaolin martial arts monk, cartoon style, cel-shaded, flat colors with clean black outlines. Centered on transparent background, square 1:1 crop, no background. Neutral standing pose, front-facing. Beige-brown fitted traditional monk robes, barefoot, simple cloth belt, hair tied in a bun, calm but ready expression. Inspired by Avatar The Last Airbender mixed with modern mobile game characters. 2D flat shading, high resolution 1024x1024.

**Tigre masculino:**
> Full-body character design of a male tiger-themed shaolin martial arts warrior, cartoon style, cel-shaded, flat colors with clean black outlines. Centered on transparent background, square 1:1 crop, no background. Neutral standing pose, front-facing. Orange and black tiger-striped martial arts uniform, claw-like hand wraps, tiger tail sash, fierce expression, muscular build. Inspired by Avatar The Last Airbender mixed with mobile game characters. 2D flat shading, high resolution 1024x1024.

**Dragón masculino:**
> Full-body character design of a male dragon-themed shaolin martial arts warrior, cartoon style, cel-shaded, flat colors with clean black outlines. Centered on transparent background, square 1:1 crop, no background. Neutral standing pose, front-facing. Green and gold scaled martial arts uniform, dragon horn headband, dragon claw embroidery on chest, confident expression. Inspired by Avatar The Last Airbender mixed with mobile game characters. 2D flat shading, high resolution 1024x1024.

## Cómo funciona el sistema

### 1. Función `crearAvatarImg(genero, skin)` — `public/js/api.js`

Crea un elemento `<img>` con la ruta correcta:

```js
function getSkinUrl(genero, skin) {
  const s = skin && skin !== 'default' ? skin : 'default';
  return `/images/skins/${s}-${genero}.png`;
}
```

### 2. Fallback automático

Si el PNG no existe o falla al cargar, el `onerror` muestra el emoji:

```js
img.onerror = function() {
  this.onerror = null;
  this.style.display = 'none';
  this.parentElement.innerHTML = genero === 'femenino' ? '👩' : '👨';
};
```

### 3. CSS — `public/css/style.css`

Todos los contenedores de avatar tienen `overflow: hidden` y las imágenes usan `object-fit: cover` para llenar el círculo sin deformarse:

```css
.shaolin-avatar img,
.avatar-grande img,
.luchador-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

### 4. Base de datos

Columna `skin` en la tabla `shaolins` (TEXT, default `'default'`):

```sql
skin TEXT DEFAULT 'default'
```

### 5. Bots

Los bots generados reciben una skin aleatoria de la lista:

```js
const skins = ['default', 'tigre', 'dragon', 'grulla', 'sombra', 'loto'];
```

## Cómo agregar una skin nueva

1. Generar los PNGs con Leonardo AI (masculino y femenino)
2. Colocarlos en `public/images/skins/` con el nombre: `{skin}-masculino.png` y `{skin}-femenino.png`
3. Agregar el nombre al array `skins` en `game/data.js`
4. Opcional: agregar la skin como opción seleccionable en la creación de personaje

## Uso en vistas

| Vista | Contenedor | Tamaño | Archivo JS |
|-------|-----------|--------|------------|
| Dashboard (cards) | `.shaolin-avatar` | 64×64px círculo | `dashboard.js` |
| Detalle del personaje | `.avatar-grande` | 120×120px círculo | `shaolin.js` |
| Arena de combate | `.luchador-avatar` | 64×64px círculo | `combate.js` |
| Creación (resultado) | `#resultado-avatar` | 120×120px círculo | `crear-shaolin.js` |

## Archivos modificados para implementar el sistema

| Archivo | Cambio |
|---------|--------|
| `db/schema.sql` | Columna `skin TEXT DEFAULT 'default'` |
| `db/database.js` | Migración ALTER TABLE para DBs existentes |
| `game/data.js` | Array `skins`, función `randomSkin()`, bots con skin |
| `routes/shaolin.js` | Acepta campo `skin` en creación |
| `public/js/api.js` | `getSkinUrl()`, `getColor()`, `crearAvatarImg()` |
| `public/css/style.css` | `overflow: hidden` + `object-fit: cover` |
| `public/js/dashboard.js` | `<img>` en vez de emoji |
| `public/js/shaolin.js` | `<img>` en vez de emoji |
| `public/js/combate.js` | `<img>` en vez de emoji |
| `public/js/crear-shaolin.js` | `<img>` en vez de emoji |
