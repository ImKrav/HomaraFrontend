# language: es
@admin-productos @ESC32
Característica: Administración de productos
  Como administrador de Homara
  Quiero crear y eliminar productos desde el panel
  Para mantener el catálogo al día

  Antecedentes:
    Dado que Andrés inició sesión como administrador

  Escenario: SP-32 Crear un producto y luego eliminarlo
    Cuando crea el producto "Nivel Láser" a $ 189.900 con 15 unidades en stock
    Entonces ve el aviso "Producto guardado correctamente"
    Y encuentra el producto en el listado del panel
    Y el producto aparece en el catálogo
    Cuando elimina el producto desde el panel
    Entonces ve el aviso "Producto eliminado correctamente"
    Y el listado del panel no muestra resultados
    Y el producto ya no aparece en el catálogo

  Escenario: SP-33 No se puede crear un producto con precio 0
    Cuando crea el producto "Nivel Láser" a $ 0 con 15 unidades en stock
    Entonces el formulario de producto muestra el error "El precio normal debe ser un número positivo válido."
    Y el formulario de producto sigue abierto
    Y el producto no aparece en el catálogo
