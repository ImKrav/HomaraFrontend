# language: es
@checkout
Característica: Checkout
  Como clienta de Homara
  Quiero registrar mis datos de envío y pagar mi carrito
  Para recibir mi pedido en casa

  Antecedentes:
    Dado que Andrés mantiene disponible el producto de apoyo a $ 250.000 la unidad
    Y que Camila es una clienta nueva con sesión iniciada
    Y que Camila agrega 1 unidad del producto de apoyo al carrito

  @ESC27
  Escenario: SP-25 El navegador bloquea el pago si faltan los datos de envío
    Cuando intenta pagar sin completar sus datos de envío
    Entonces el navegador marca como obligatorios el teléfono, la dirección, la ciudad y el departamento
    Y sigue en la página "/checkout"
    Y no tiene ningún pedido registrado
    Y el carrito guardado en el servidor tiene 1 unidad

  @ESC27
  Escenario: SP-26 La aplicación avisa si faltan datos aunque se salte la validación del navegador
    Cuando envía el formulario de pago vacío saltándose la validación del navegador
    Entonces ve el aviso "Por favor completa todos los campos requeridos."
    Y sigue en la página "/checkout"
    Y no tiene ningún pedido registrado

  # DEF-03: el checkout acepta datos formados solo por espacios y crea el pedido.
  @ESC27 @DEF-03 @fail
  Escenario: SP-27 Los datos de envío con solo espacios se tratan como vacíos
    Cuando paga con teléfono, dirección, ciudad y departamento formados solo por espacios
    Entonces ve el aviso "Por favor completa todos los campos requeridos."
    Y no tiene ningún pedido registrado

  @ESC28 @ESC27
  Escenario: SP-28 Checkout completo genera el pedido
    Cuando completa sus datos de envío y paga
    Entonces ve el aviso "¡Pedido realizado con éxito!"
    Y termina en la página "/proyectos"
    Y tiene 1 pedido registrado por un total de $ 275.000
    Y el carrito guardado en el servidor tiene 0 unidades
    Y el contador del carrito marca 0
