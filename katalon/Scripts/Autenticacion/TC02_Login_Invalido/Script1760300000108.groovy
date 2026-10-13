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
 * TC02 - Login inválido, data-driven (ESC02)
 * Datos: variables email, password, mensajeEsperado (columnas correo, clave y mensajeEsperado del Data File Login_Credenciales_Invalidas en las suites,
 * una iteración por fila).
 * Resultado esperado: se muestra el mensaje de error esperado, no se guarda token y se permanece en /login.
 */
int t = GlobalVariable.timeout

KeywordUtil.logInfo('Probando login inválido con: ' + email)

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.limpiarSesion'()

// 1. Abrir login
CustomKeywords.'homara.Acciones.navegarA'('/login')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Login/input_Email'), t)

// 2. Diligenciar credenciales inválidas
WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Email'), email)
WebUI.setText(findTestObject('Object Repository/Pagina_Login/input_Password'), password)

// 3. Enviar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'))

// 4. Verificar el mensaje de error del formulario
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Login/div_MensajeError'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Pagina_Login/div_MensajeError'), mensajeEsperado)
WebUI.takeScreenshot()

// 5. Sigue en /login y sin sesión
WebUI.verifyMatch(WebUI.getUrl(), '.*/login$', true)
WebUI.verifyElementPresent(findTestObject('Object Repository/Navbar/lnk_IniciarSesion'), t)
String token = CustomKeywords.'homara.Acciones.leerLocalStorage'('homara_token')
WebUI.verifyEqual(token, null)

WebUI.closeBrowser()
