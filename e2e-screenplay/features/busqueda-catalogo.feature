# language: es
@busqueda-catalogo @ESC09
Característica: Búsqueda en el catálogo
  Como visitante de Homara
  Quiero buscar productos por nombre
  Para encontrar rápido los materiales que necesito

  Antecedentes:
    Dado que Valentina no ha iniciado sesión

  Escenario: SP-14 Búsqueda con resultados
    Cuando busca "Porcelanato"
    Entonces el catálogo informa al menos un resultado
    Y la cantidad informada coincide con las tarjetas mostradas
    Y algún resultado contiene "Porcelanato" en su nombre

  Escenario: SP-15 La búsqueda no distingue mayúsculas de minúsculas
    Cuando busca "TALADRO"
    Entonces el catálogo informa al menos un resultado
    Y algún resultado contiene "Taladro" en su nombre

  Escenario: SP-16 Búsqueda sin coincidencias
    Cuando busca "zzqx producto inexistente 404"
    Entonces el catálogo informa 0 resultados
    Y no se muestra ninguna tarjeta de producto
    Y se indica que no hay productos coincidentes
