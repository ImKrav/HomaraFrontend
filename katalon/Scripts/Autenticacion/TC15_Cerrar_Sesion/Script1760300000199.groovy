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
 * TC15 - Cerrar sesión (ESC03)
 * Precondición: sesión iniciada con el usuario CUSTOMER.
 * Resultado esperado: tras "Cerrar Sesión" se redirige a /login, aparece el enlace "Iniciar Sesión",
 * se elimina el token de localStorage y una ruta privada vuelve a redirigir a /login.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
WebUI.takeScreenshot()

// 1. Abrir el menú de usuario y cerrar sesión
WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_MenuUsuario'), t)
WebUI.click(findTestObject('Object Repository/Navbar/btn_MenuUsuario'))
WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_CerrarSesion'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Navbar/btn_CerrarSesion'), 'Cerrar Sesión')
WebUI.click(findTestObject('Object Repository/Navbar/btn_CerrarSesion'))

// 2. Verificar la redirección y el estado sin sesión
CustomKeywords.'homara.Acciones.esperarUrl'('.*/login$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/login$', true)
WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/lnk_IniciarSesion'), t)
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Navbar/span_NombreUsuario'), t)
String token = CustomKeywords.'homara.Acciones.leerLocalStorage'('homara_token')
WebUI.verifyEqual(token, null)
WebUI.takeScreenshot()

// 3. Una ruta privada ya no es accesible
CustomKeywords.'homara.Acciones.navegarA'('/cuenta')
CustomKeywords.'homara.Acciones.esperarUrl'('.*/login$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/login$', true)

WebUI.closeBrowser()
