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
 * TC01 - Login exitoso (ESC02)
 * Datos: variables email, password, nombreEsperado (columnas correo, clave y nombreEsperado del Data File Login_Credenciales_Validas en las suites).
 * Resultado esperado: redirección a /cuenta, título "Mi Cuenta" y nombre del usuario en la barra de navegación.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.limpiarSesion'()

// 1. Abrir la página de login
CustomKeywords.'homara.Acciones.navegarA'('/login')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Login/input_Email'), t)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pagina_Login/input_Password'), t)

// 2. Diligenciar credenciales válidas
WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Email'), email)
WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Password'), password)
WebUI.takeScreenshot()

// 3. Enviar el formulario
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'))

// 4. Verificaciones: URL /cuenta, título de la cuenta y nombre en la barra
CustomKeywords.'homara.Acciones.esperarUrl'('.*/cuenta$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/cuenta$', true)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Cuenta/h1_MiCuenta'), t)
WebUI.verifyElementVisible(findTestObject('Object Repository/Pagina_Cuenta/h1_MiCuenta'))
WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/span_NombreUsuario'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Navbar/span_NombreUsuario'), nombreEsperado)

// 5. El token JWT quedó almacenado
String token = CustomKeywords.'homara.Acciones.leerLocalStorage'('homara_token')
WebUI.verifyNotEqual(token, null)
WebUI.takeScreenshot()

WebUI.closeBrowser()
