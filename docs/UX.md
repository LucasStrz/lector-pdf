# Biblioteca y lector: criterios de interfaz

## Direccion visual

Interfaz de lectura tranquila: superficies claras, cards con paginas reales
y una jerarquia corta entre titulo, progreso y acciones. Los detalles
secundarios y las acciones destructivas viven en el menu del documento.

Paleta otonal adaptada al producto:

| Uso | Color |
| --- | --- |
| Accion principal / borgona | #6A2C2E |
| Progreso / oliva | #596448 |
| Acento / terracota | #B3674C |
| Acento / ocre | #B48235 |
| Fondo | #F7F6F2 |
| Texto principal | #302D2C |
| Texto secundario | #706866 |

Inspiracion: [Autumn Colors, ColorDrop](https://colordrop.io/palette/56972).
Los tonos se distribuyen sobre superficies blancas para no competir con los PDFs.
Las paginas se muestran completas, sin recortarlas ni alterar sus colores.

## Comportamiento

- Miniaturas de la primera pagina, generadas localmente al entrar en pantalla.
- Cola de renderizado y cache en memoria para evitar procesar toda la biblioteca a la vez.
- Skeletons con dimensiones estables durante cargas reales; sin demoras artificiales.
- Menus con foco contenido en el dialogo, Escape para cerrar y retorno de foco al origen.
- Confirmacion explicita antes de borrar; cancelar es la opcion enfocada inicialmente.
- Edicion confirmada despues del commit de IndexedDB, con error y reintento.
- Botones de accion de al menos 44 px; estados visibles de foco.
- Animaciones de entrada de 180-220 ms, desactivadas con prefers-reduced-motion.
- La pagina anterior permanece visible mientras se prepara la siguiente.

## Fuentes

- [NN/g: Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/):
  placeholders que anticipan la estructura del contenido durante su carga.
- [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/):
  foco, contraste, objetivos tactiles y movimiento. La implementacion aplica estos
  criterios, pero no constituye una auditoria completa de conformidad.

## Verificacion

Pruebas de navegador en 320, 390 y 1440 px: contenido real de miniaturas,
busqueda, orden, lectura, progreso, detalles, renombrado y borrado persistentes,
cancelacion, retorno de foco y preferencia de movimiento reducido.
