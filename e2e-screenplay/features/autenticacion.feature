# language: es
@autenticacion
Característica: Autenticación de clientes
  Como clienta de Homara
  Quiero registrarme, iniciar sesión y cerrarla
  Para comprar y guardar mis proyectos de forma segura

  @ESC01
  Regla: ESC01 - Solo se crea la cuenta con datos válidos y un correo que no esté registrado

    Escenario: SP-01 Registro con datos válidos
      Dado que Camila no tiene cuenta en Homara
      Cuando Camila se registra con datos válidos
      Entonces llega a su cuenta
      Y la barra de navegación muestra el nombre "Camila"
      Y su sesión queda guardada en el navegador

    Escenario: SP-02 Registro con un correo que ya existe
      Dado que Camila no tiene cuenta en Homara
      Cuando Camila intenta registrarse con el correo "juan@email.com"
      Entonces el registro muestra el error "El correo electrónico ya está registrado."
      Y sigue en la página "/register"
      Y no queda ninguna sesión en el navegador

    Escenario: SP-03 Registro con contraseñas que no coinciden
      Dado que Camila no tiene cuenta en Homara
      Cuando Camila intenta registrarse con una confirmación de contraseña distinta
      Entonces el registro muestra el error "Las contraseñas no coinciden."
      Y sigue en la página "/register"
      Y no queda ninguna sesión en el navegador

    # DEF-01: el formulario indica "Mínimo 6 caracteres" pero el backend exige 8 (RN-002).
    @DEF-01
    Escenario: SP-04 Registro con una contraseña de 7 caracteres
      Dado que Camila no tiene cuenta en Homara
      Cuando Camila intenta registrarse con una contraseña de 7 caracteres
      Entonces el registro muestra un error que contiene "al menos 8 caracteres"
      Y sigue en la página "/register"
      Pero el campo de contraseña sigue indicando "Mínimo 6 caracteres"

  @ESC02
  Regla: ESC02 - Solo inicia sesión quien presenta credenciales válidas

    Escenario: SP-05 Inicio de sesión con credenciales válidas
      Dado que Camila no ha iniciado sesión
      Cuando Camila inicia sesión con la cuenta de cliente de demostración
      Entonces llega a su cuenta
      Y la barra de navegación muestra el nombre "Juan"
      Y su sesión queda guardada en el navegador

    Escenario: SP-06 Inicio de sesión con una contraseña incorrecta
      Dado que Camila no ha iniciado sesión
      Cuando Camila inicia sesión con la cuenta de cliente de demostración y una contraseña incorrecta
      Entonces el inicio de sesión muestra el error "Credenciales incorrectas. Verifique correo y contraseña."
      Y sigue en la página "/login"
      Y no queda ninguna sesión en el navegador

    Escenario: SP-07 Inicio de sesión con un correo no registrado recibe el mismo mensaje genérico
      Dado que Camila no ha iniciado sesión
      Cuando Camila inicia sesión con un correo que no está registrado
      Entonces el inicio de sesión muestra el error "Credenciales incorrectas. Verifique correo y contraseña."
      Y sigue en la página "/login"

  @ESC03
  Regla: ESC03 - Al cerrar sesión se pierde el acceso a la cuenta

    Escenario: SP-08 Cerrar sesión desde el menú de la cuenta
      Dado que Camila es una clienta nueva con sesión iniciada
      Cuando cierra sesión desde el menú de su cuenta
      Entonces termina en la página "/login"
      Y no queda ninguna sesión en el navegador
      Y al abrir de nuevo "/cuenta" termina en la página "/login"
