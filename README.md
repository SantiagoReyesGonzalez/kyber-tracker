# ⚡ Kaidin // Control Diario de Hábitos

Sistema de seguimiento y auditoría diaria de estudio enfocado en **Inglés** y **Data Engineering**. Construido con **Vite**, **Vanilla JavaScript (ES Modules)**, **HTML5/CSS3** y **Web Audio API**, optimizado para 144 FPS estables, descanso visual y alta ergonomía en cualquier dispositivo.

---

## 🌟 Características Principales

### 1. 📅 Calendario Mensual Interactivo
- **Visualización de 7 columnas**: Navegación mes a mes con saltos rápidos.
- **Códigos de color de alto contraste**:
  - 🟢 **Inglés** (Turquesa / Teal)
  - 🟣 **Data Engineering** (Violeta)
  - 🟡 **Dual Master** (Días con ambos hábitos completados)
  - 🔴 **Días sin registro** (Cualquier día pasado sin estudio se resalta automáticamente en rojo)
- **Registro retroactivo**: Pulsa cualquier fecha para abrir el modal de edición y registrar temas, notas u horas.

### 2. 📊 Métricas Dinámicas (Semana | Mes | General)
- **Selector de alcance temporal**: Alterna al instante las estadísticas entre la semana en curso (Lunes a Domingo), el mes seleccionado o el histórico acumulado general.
- **Rachas en tiempo real**: Cálculo de días consecutivos de estudio continuo.
- **Horas y Cobertura**: Porcentaje de consistencia del período seleccionado.

### 3. 🗺️ Mapa Anual de Consistencia (Heatmap de 52 Semanas)
- Visualización compacta inspirada en GitHub y Linear que refleja tu constancia a lo largo de todo el año.
- Filtros interactivos por disciplina y tooltips informativos por fecha.

### 4. 📈 Distribución Semanal
- Gráfico de barras que mide qué días de la semana tienes mayor actividad de estudio.

### 5. 📝 Registro Rápido (Quick Check-in) y Bitácora Histórica
- **Registro diario en 1 clic**: Marca hoy, añade temas rápidos con etiquetas (`#Speaking`, `#SQL`, `#Spark`, `#dbt`) y guarda.
- **Bitácora con buscador**: Filtra y consulta tus notas de estudio en tiempo real.
- **Exportación e Importación**: Descarga y restauración de respaldos en formato `.json`.

### 6. 🌙 Modo Oscuro y Modo Claro
- Paleta profunda *Obsidian & Slate* para trabajo nocturno sin fatiga visual.
- Conmutador en el encabezado con persistencia en `localStorage` y script anti-parpadeo (*Zero-FOUC*).

### 7. 📱 Adaptabilidad Total (Responsive)
- Calibrado al detalle para **Smartphones** (`<= 480px`), **Phablets** (`481px - 768px`), **Tablets e iPads** (`769px - 1024px`) y **Portátiles / Desktops**.

### 8. 🔊 Audio Reactivo con Web Audio API
- Efectos de sonido sintetizados matemáticamente en tiempo real (sin archivos de audio pesados externos), con botón para silenciar o activar en un clic.

---

## 🚀 Instalación y Uso Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/SantiagoReyesGonzalez/kyber-tracker.git
   ```

2. Entra en el directorio del proyecto:
   ```bash
   cd kyber-tracker
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre en tu navegador:
   `http://localhost:3000`

---

## 🛠️ Tecnologías Utilizadas

- **Vite** (Build tool & dev server)
- **Vanilla JavaScript moderno (ES Modules)**
- **CSS3 moderno** (Variables, Grid, Flexbox, Keyframe Animations, `@media` queries)
- **Web Audio API** (Sintetizador procedural de audio)
- **HTML5 Semantic** (`<dialog>`, `<aside>`, `<main>`)
