# language: es
@proyectos @ESC17
Característica: Crear proyecto
  Como clienta de Homara
  Quiero crear un proyecto con las medidas de mi espacio
  Para calcular los insumos que necesito comprar

  Antecedentes:
    Dado que Camila es una clienta nueva con sesión iniciada

  Escenario: SP-29 Crear un proyecto de piso con datos válidos
    Cuando crea un proyecto de piso "Remodelación cocina" de 4.5 m de largo por 3.2 m de ancho
    Entonces ve el detalle del proyecto "Remodelación cocina"

  Escenario: SP-30 No se puede guardar un proyecto sin nombre
    Cuando crea un proyecto de piso sin nombre de 4.5 m de largo por 3.2 m de ancho
    Entonces ve el aviso "Por favor, ingresa el campo obligatorio: Nombre descriptivo."
    Y sigue en la página "/proyectos/nuevo"

  Escenario: SP-31 No se puede guardar un proyecto de piso sin el ancho
    Cuando crea un proyecto de piso "Baño social" de 2.5 m de largo sin indicar el ancho
    Entonces ve el aviso "Por favor, ingresa el campo obligatorio: Ancho (Habitación)."
    Y sigue en la página "/proyectos/nuevo"
