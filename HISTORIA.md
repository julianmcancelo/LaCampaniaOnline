# Sangre y Plata - Lore y Transición de Reglas

Este documento detalla el trasfondo narrativo (Lore) del juego, situándolo en una Pampa mítica de fantasía oscura y folklore. Mecánicamente, **el juego y las estadísticas no se alteran**; las mecánicas originales de ventaja y daño se mantienen intactas. Solo se transforman la estética y el nombre de los elementos.

---

## 1. El Conflicto (La Historia de Fondo)

La llanura es inmensa y no perdona. En los confines de estas tierras, más allá de la ley del hombre, se libran combates silenciosos. Aquí, el respeto se gana a filo de facón y las noches están plagadas de terrores antiguos que acechan desde los pajonales. 
Diferentes Facciones luchan por el control de la llanura. Sus defensas son los antiguos *Fortines* de barro y madera, que guardan la riqueza e historia de la región. Quien logre acumular suficiente plata en su Fortín —o logre incendiar el de su rival—, se declarará el dueño absoluto de la frontera.

---

## 2. Los Guerreros (Equivalencias y Trasfondo)

Las mecánicas de vida base (Vida: 10), ataque e iniciativas se mantienen idénticas. El famoso triángulo de ventaja sigue presente:
**Curandero** le gana a **Gaucho**, **Gaucho** le gana a **Rastrero**, **Rastrero** le gana a **Curandero**.

### El Gaucho (Equivalente: Caballero)
* **Estadísticas Base:** 10 Vida
* **Arma Compatible:** El Facón (Ex Espada)
* **La Ventaja:** Fuerte en cuerpo a cuerpo, domina al Rastrero.
* **Lore:** 
  Ni la ley ni la muerte lo apuran. El Gaucho es el dueño del horizonte. Nacido del viento de la pampa, su facón, heredado de batallas silenciadas por el tiempo, corta más rápido que el aliento de quien se atreve a enfrentarlo. No pelea por reyes ni banderas; pelea por su honor, su libertad y el respeto de la llanura. En combate, su postura defensiva absorbe los embates antes de responder con una estocada letal.

### El Rastrero (Equivalente: Arquero)
* **Estadísticas Base:** 10 Vida
* **Arma Compatible:** Boleadoras (Ex Flecha)
* **La Ventaja:** Rápido y esquivo, domina al Curandero impidiéndole usar magia de cerca.
* **Lore:** 
  Hábil como un lince, silencioso y letal. El Rastrero rara vez se deja ver. Actúa entre la neblina del amanecer y agazapado en el pasto seco de la estepa. Las piedras de sus boleadoras zumban como el viento oscuro antes de quebrar los huesos de su presa. Es el cazador nato en la inmensidad del llano, capaz de atrapar a quien sea desde una gran distancia sin arriesgar el pellejo.

### El Curandero (Equivalente: Mago)
* **Estadísticas Base:** 10 Vida
* **Arma Compatible:** El Gualicho / Yuyo (Ex Poción)
* **La Ventaja:** Conoce los secretos de la tierra y los hechizos para desarmar a los letales Gauchos.
* **Lore:** 
  Guardián de los conocimientos oscuros y la magia de la Salamanca. El Curandero lanza hechizos al enemigo armando gualichos, tirando fetiches de hueso y cruces de sal. Conoce los yuyos que cierran heridas y los rezos que hielan la sangre de adversarios fornidos. Si la tierra y el humo están de su lado, el destino se quiebra a su antojo.

### El Lobizón (Equivalente: Dragón / Bestia Mítica)
* **Estadísticas Base:** 10 Vida
* **Arma Compatible:** Garras Naturales
* **La Ventaja:** Daño destructivo puro e ignorancia de ventajas tradicionales humanas.
* **Lore:** 
  Cuenta el mito que el séptimo hijo varón cargó con el castigo del monte. Cuando la luna llena baña de blanco la tranquera, la carne humana se desgarra dando lugar a una bestia sanguinaria, peluda y de ojos chispeantes. El Lobizón es pura furia primaria. Ningún arma ligera puede penetrar su grueso cuero tan fácil. Cuando pisa el campo, no deja más que sangre en los corrales.

---

## 3. Armas y Recursos

Los recursos para atacar ahora reflejan las herramientas típicas argentinas:

| Nombre Original | Nuevo Nombre       | Uso |
|-----------------|--------------------|-----|
| Espada          | **El Facón**       | Arma de daño directo. Uso exclusivo del Gaucho. |
| Flecha          | **Las Boleadoras** | Daño a distancia. Uso exclusivo del Rastrero. |
| Poción          | **El Gualicho**    | Daño "Mágico/Indirecto". Uso exclusivo del Curandero. |
| Oro             | **La Plata** (Reales)| Funciona igual que el oro, base de la economía para reclutar y construir fortines. |

---

## 4. Estructuras y Especiales

Las reglas para usar estas cartas (acciones en turnos o emboscadas) no se alteran. 

| Original   | Versión Folklore | Trasfondo / Efecto Conservado |
|------------|------------------|----------------------------------------------------|
| **Castillo** | **El Fortín**    | La base que los jugadores deben proteger y llenar de *Plata* para ganar. Puede ser asediado. |
| **Reliquia** | **Poncho de Leyenda** | Objeto mítico inserto en el fortín para lograr la victoria de manera alternativa (Regla si existiese/se modificara). |
| **Poder**    | **Coraje**       | Refuerza a tu unidad (Buff táctico). |
| **Asedio**   | **El Malón**     | Daña de forma indirecta y arrasadora a los fortines o campos rivales. |
| **Ladron**   | **El Cuatrero**  | Permite robar cartas y recursos económicos del oponente (cuatrerismo en el campo). |
| **Espía**    | **El Baqueano**  | El Baqueano sabe leer la huella; permite espiar la mano/campo del enemigo y prever todo movimiento. |

---

> Todas estas cartas y clases conservan sus IDs matemáticos, puntos de vida, sistema de turno y reglas de validación en TypeScript. Sólo estamos vistiendo el código interno (`tipos.ts`, `constantes.ts`) y la visual de cara al jugador para tener una experiencia completamente nativa y épica.
