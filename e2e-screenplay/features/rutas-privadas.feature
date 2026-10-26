# language: es
@rutas-privadas @ESC07
Característica: Protección de rutas privadas
  Como responsable de Homara
  Quiero que las páginas privadas exijan sesión y el rol adecuado
  Para que nadie vea información o herramientas que no le corresponden

  Esquema del escenario: <caso> Una visitante sin sesión que abre <ruta> es enviada al inicio de sesión
    Dado que Valentina no ha iniciado sesión
    Cuando abre la página "<ruta>"
    Entonces termina en la página "/login"
    Y no queda ninguna sesión en el navegador

    Ejemplos:
      | caso  | ruta       |
      | SP-09 | /proyectos |
      | SP-10 | /cuenta    |
      | SP-11 | /checkout  |

  @ESC06
  Escenario: SP-12 Una clienta no puede entrar al panel de administración
    Dado que Camila inició sesión con la cuenta de cliente de demostración
    Cuando abre la página "/admin/productos"
    Entonces termina en la página "/"
    Y no ve el panel de administración de productos

  @ESC06
  Escenario: SP-13 El administrador sí puede entrar al panel de administración
    Dado que Andrés inició sesión como administrador
    Cuando abre la página "/admin/productos"
    Entonces ve el panel de administración de productos
    Y sigue en la página "/admin/productos"
