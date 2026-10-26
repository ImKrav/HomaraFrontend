# language: es
@carrito
Característica: Carrito de compras
  Como clienta de Homara
  Quiero agregar, modificar y eliminar productos de mi carrito y ver sus totales
  Para saber cuánto voy a pagar antes de hacer el pedido

  Regla de envío (RN-031): el envío cuesta $ 25.000 y es gratis desde $ 500.000.

  Antecedentes:
    Dado que Andrés mantiene disponible el producto de apoyo a $ 250.000 la unidad
    Y que Camila es una clienta nueva con sesión iniciada

  @ESC13
  Escenario: SP-17 Agregar un producto al carrito
    Cuando Camila agrega 1 unidad del producto de apoyo al carrito
    Entonces el contador del carrito marca 1
    Cuando abre su carrito
    Entonces el producto de apoyo aparece con 1 unidad
    Y el carrito guardado en el servidor tiene 1 unidad

  @ESC13
  Escenario: SP-18 Agregar dos veces el mismo producto acumula la cantidad en una sola línea
    Cuando Camila agrega 2 unidades del producto de apoyo al carrito
    Entonces el contador del carrito marca 2
    Cuando abre su carrito
    Entonces el carrito tiene 1 línea
    Y el producto de apoyo aparece con 2 unidades

  @ESC14 @ESC16
  Escenario: SP-19 Aumentar la cantidad recalcula el subtotal
    Dado que Camila agrega 1 unidad del producto de apoyo al carrito
    Y abre su carrito
    Cuando aumenta en una unidad la cantidad del producto de apoyo
    Entonces el producto de apoyo aparece con 2 unidades
    Y el subtotal es $ 500.000
    Y el contador del carrito marca 2
    Y el carrito guardado en el servidor tiene 2 unidades

  @ESC14 @ESC16
  Escenario: SP-20 Disminuir la cantidad vuelve a cobrar el envío
    Dado que Camila agrega 2 unidades del producto de apoyo al carrito
    Y abre su carrito
    Y el subtotal es $ 500.000
    Cuando disminuye en una unidad la cantidad del producto de apoyo
    Entonces el subtotal es $ 250.000
    Y el envío cuesta $ 25.000
    Y el total es $ 275.000
    Y el contador del carrito marca 1

  @ESC15
  Escenario: SP-21 Eliminar el único producto deja el carrito vacío
    Dado que Camila agrega 1 unidad del producto de apoyo al carrito
    Y abre su carrito
    Cuando elimina el producto de apoyo del carrito
    Entonces el carrito se muestra vacío
    Y el contador del carrito marca 0
    Y el carrito guardado en el servidor tiene 0 unidades

  @ESC16
  Escenario: SP-22 Con subtotal menor a $ 500.000 se cobra el envío
    Dado que Camila agrega 1 unidad del producto de apoyo al carrito
    Cuando abre su carrito
    Entonces el subtotal es $ 250.000
    Y el envío cuesta $ 25.000
    Y el total es $ 275.000

  @ESC16
  Escenario: SP-23 Con subtotal mayor a $ 500.000 el envío es gratis
    Dado que Camila agrega 3 unidades del producto de apoyo al carrito
    Cuando abre su carrito
    Entonces el subtotal es $ 750.000
    Y el envío es gratis
    Y el total es $ 750.000

  # DEF-02: RN-031 dice "igual o mayor a $ 500.000", pero el backend usa "subtotal > 500000".
  # @fail lo marca como fallo esperado: si el defecto se corrige, Playwright avisará para quitar la marca.
  @ESC16 @DEF-02 @fail
  Escenario: SP-24 Con subtotal exactamente igual a $ 500.000 el envío es gratis
    Dado que Camila agrega 2 unidades del producto de apoyo al carrito
    Cuando abre su carrito
    Entonces el subtotal es $ 500.000
    Y el envío es gratis
    Y el total es $ 500.000
