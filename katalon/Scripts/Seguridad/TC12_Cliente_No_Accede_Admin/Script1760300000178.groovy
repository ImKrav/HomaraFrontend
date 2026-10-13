import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import java.util.regex.Pattern

import org.openqa.selenium.Keys as Keys

import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.testobject.TestObject as TestObject
import com.kms.katalon.core.util.KeywordUtil as KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/*
 * TC12 - Un cliente no accede a /admin (ESC07, ESC32, negativo)
 * Precondición: sesión iniciada con el usuario CUSTOMER.
 * Resultado esperado: al abrir /admin se redirige al inicio (/), no se ve el menú de administración
 * y el menú de usuario no ofrece la opción "Panel Admin".
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)

// 1. Intentar abrir el panel de administración
CustomKeywords.'homara.Acciones.navegarA'('/admin')

// 2. Verificar la redirección al inicio
String regexInicio = '^' + Pattern.quote(GlobalVariable.baseUrl.toString().replaceAll('/+$', '')) + '/?$'
CustomKeywords.'homara.Acciones.esperarUrl'(regexInicio)
WebUI.verifyMatch(WebUI.getUrl(), regexInicio, true)

// 3. No hay menú de administración ni enlace al panel
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pagina_Admin_Productos/lnk_MenuProductos'), 3)
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pagina_Admin_Productos/btn_AgregarProducto'), 3)
WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_MenuUsuario'), t)
WebUI.click(findTestObject('Object Repository/Navbar/btn_MenuUsuario'))
WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/btn_CerrarSesion'), t)
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Navbar/lnk_PanelAdmin'), 3)
WebUI.takeScreenshot()

WebUI.closeBrowser()
