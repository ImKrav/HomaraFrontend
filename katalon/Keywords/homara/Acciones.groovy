package homara

import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import java.time.Duration

import org.openqa.selenium.By
import org.openqa.selenium.WebDriver
import org.openqa.selenium.support.ui.ExpectedCondition
import org.openqa.selenium.support.ui.ExpectedConditions
import org.openqa.selenium.support.ui.WebDriverWait

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.common.WebUiCommonHelper
import com.kms.katalon.core.webui.driver.DriverFactory
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable

/**
 * Acciones reutilizables para los casos de prueba de Homara.
 *
 * Todas las esperas son explícitas (waitForElementVisible / waitForElementClickable /
 * WebDriverWait con condición). No se usan pausas fijas (WebUI.delay).
 *
 * Uso desde un caso de prueba:
 *   CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
 */
public class Acciones {

	/** Tiempo máximo de espera configurado en el perfil (segundos). */
	static int espera() {
		return (GlobalVariable.timeout ?: 15) as int
	}

	/** Construye la URL absoluta a partir de una ruta relativa (por ejemplo '/login'). */
	static String url(String ruta) {
		String base = GlobalVariable.baseUrl.toString().replaceAll('/+$', '')
		return base + (ruta ?: '')
	}

	/**
	 * Abre el navegador maximizado (diseño de escritorio, menú de usuario visible)
	 * y navega a la ruta indicada.
	 */
	@Keyword
	def abrirNavegador(String ruta) {
		WebUI.openBrowser('')
		WebUI.maximizeWindow()
		WebUI.navigateToUrl(url(ruta))
	}

	/** Navega a una ruta de la aplicación (relativa a GlobalVariable.baseUrl). */
	@Keyword
	def navegarA(String ruta) {
		WebUI.navigateToUrl(url(ruta))
	}

	/**
	 * Espera explícita hasta que la URL actual cumpla la expresión regular indicada.
	 * Falla el caso si no se cumple dentro del tiempo máximo.
	 */
	@Keyword
	def esperarUrl(String regex) {
		int limite = espera()
		WebDriver driver = DriverFactory.getWebDriver()
		try {
			new WebDriverWait(driver, Duration.ofSeconds(limite)).until(ExpectedConditions.urlMatches(regex))
		} catch (Exception e) {
			KeywordUtil.markFailedAndStop("La URL no cumplió '" + regex + "' en " + limite + " s. URL actual: " + driver.getCurrentUrl())
		}
		KeywordUtil.logInfo('URL actual: ' + driver.getCurrentUrl())
	}

	/**
	 * Elimina la sesión del navegador: token JWT (localStorage 'homara_token'),
	 * sessionStorage y cookies. Deja el navegador en la página de inicio.
	 */
	@Keyword
	def limpiarSesion() {
		WebUI.navigateToUrl(url('/'))
		WebUI.executeJavaScript('window.localStorage.clear(); window.sessionStorage.clear();', null)
		WebUI.deleteAllCookies()
		WebUI.refresh()
	}

	/**
	 * Inicia sesión desde /login y espera a quedar autenticado
	 * (redirección a /cuenta y nombre visible en la barra de navegación).
	 */
	@Keyword
	def iniciarSesion(String email, String password) {
		limpiarSesion()
		WebUI.navigateToUrl(url('/login'))
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Login/input_Email'), espera())
		WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Email'), email)
		WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Password'), password)
		WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'), espera())
		WebUI.click(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'))
		esperarUrl('.*/cuenta$')
		WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/span_NombreUsuario'), espera())
		WebUI.verifyElementVisible(findTestObject('Object Repository/Navbar/span_NombreUsuario'))
	}

	/**
	 * Cierra la sesión desde el menú de usuario de la barra de navegación
	 * y espera la redirección a /login.
	 */
	@Keyword
	def cerrarSesion() {
		WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_MenuUsuario'), espera())
		WebUI.click(findTestObject('Object Repository/Navbar/btn_MenuUsuario'))
		WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_CerrarSesion'), espera())
		WebUI.click(findTestObject('Object Repository/Navbar/btn_CerrarSesion'))
		esperarUrl('.*/login$')
		WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/lnk_IniciarSesion'), espera())
	}

	/**
	 * Vacía el carrito del usuario autenticado desde /carrito, eliminando los ítems
	 * uno por uno y esperando a que la lista disminuya tras cada clic.
	 */
	@Keyword
	def limpiarCarrito() {
		WebUI.navigateToUrl(url('/carrito'))
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h1_TituloCarrito'), espera())

		TestObject botonEliminar = findTestObject('Object Repository/Pagina_Carrito/btn_EliminarItem')
		By localizadorBoton = WebUiCommonHelper.buildLocator(botonEliminar)
		By localizadorVacio = WebUiCommonHelper.buildLocator(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'))
		By localizadorTitulo = WebUiCommonHelper.buildLocator(findTestObject('Object Repository/Pagina_Carrito/h1_TituloCarrito'))
		WebDriver driver = DriverFactory.getWebDriver()
		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(espera()))

		// El carrito termina de cargar cuando aparece un ítem o el mensaje de carrito vacío
		wait.until(ExpectedConditions.or(
				ExpectedConditions.presenceOfElementLocated(localizadorBoton),
				ExpectedConditions.visibilityOfElementLocated(localizadorVacio)))

		int intentos = 0
		while (driver.findElements(localizadorBoton).size() > 0 && intentos < 30) {
			final int antes = driver.findElements(localizadorBoton).size()
			WebUI.waitForElementClickable(botonEliminar, espera())
			WebUI.click(botonEliminar)
			// Tras eliminar, el carrito se recarga (estado "Cargando..."): se espera a que vuelva a
			// mostrarse el título y a que haya un ítem menos que antes del clic
			wait.until({ WebDriver d ->
				d.findElements(localizadorTitulo).size() > 0 && d.findElements(localizadorBoton).size() < antes
			} as ExpectedCondition<Boolean>)
			intentos++
		}
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'), espera())
		KeywordUtil.logInfo('Carrito vacío (ítems eliminados: ' + intentos + ')')
	}

	/**
	 * Busca un producto en el catálogo, abre su detalle y lo agrega al carrito,
	 * verificando el toast de confirmación.
	 */
	@Keyword
	def agregarProductoAlCarrito(String terminoBusqueda, String nombreProducto) {
		WebUI.navigateToUrl(url('/catalogo'))
		WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/lnk_PrimerProducto'), espera())
		WebUI.setText(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), terminoBusqueda)
		WebUI.sendKeys(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.ENTER))

		TestObject tarjeta = findTestObject('Object Repository/Pagina_Catalogo/lnk_ProductoPorNombre', [('nombre') : nombreProducto])
		WebUI.waitForElementClickable(tarjeta, espera())
		WebUI.click(tarjeta)

		WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Producto/h1_NombreProducto', [('nombre') : nombreProducto]), espera())
		WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Producto/btn_AgregarAlCarrito'), espera())
		WebUI.click(findTestObject('Object Repository/Pagina_Producto/btn_AgregarAlCarrito'))

		WebUI.waitForElementVisible(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Producto agregado al carrito exitosamente']), espera())
		WebUI.verifyElementVisible(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Producto agregado al carrito exitosamente']))
	}

	/** Devuelve el valor de localStorage para la clave indicada (null si no existe). */
	@Keyword
	def leerLocalStorage(String clave) {
		return WebUI.executeJavaScript('return window.localStorage.getItem(arguments[0]);', [clave])
	}
}
