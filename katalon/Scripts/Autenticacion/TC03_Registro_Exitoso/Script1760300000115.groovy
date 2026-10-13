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
 * TC03 - Registro exitoso (ESC01)
 * Datos: nombre, apellido, prefijoEmail, dominioEmail, password (Data File Registro_Datos_Validos en las suites).
 * El correo se vuelve único con una marca de tiempo para poder repetir la ejecución.
 * Resultado esperado: el usuario queda autenticado, es redirigido a /cuenta y ve su nombre en la barra.
 */
int t = GlobalVariable.timeout
String emailUnico = prefijoEmail + '.' + System.currentTimeMillis() + '@' + dominioEmail
KeywordUtil.logInfo('Correo generado para el registro: ' + emailUnico)

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.limpiarSesion'()

// 1. Abrir el formulario de registro
CustomKeywords.'homara.Acciones.navegarA'('/register')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Registro/input_Nombre'), t)

// 2. Diligenciar los datos obligatorios
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Nombre'), nombre)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Apellido'), apellido)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Email'), emailUnico)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Password'), password)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_ConfirmarPassword'), password)
WebUI.takeScreenshot()

// 3. Enviar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Registro/btn_Registrarme'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Registro/btn_Registrarme'))

// 4. Verificaciones: redirección a /cuenta y nombre en la barra de navegación
CustomKeywords.'homara.Acciones.esperarUrl'('.*/cuenta$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/cuenta$', true)
WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/span_NombreUsuario'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Navbar/span_NombreUsuario'), nombre)
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pagina_Registro/div_MensajeError'), 2)
String token = CustomKeywords.'homara.Acciones.leerLocalStorage'('homara_token')
WebUI.verifyNotEqual(token, null)
WebUI.takeScreenshot()

WebUI.closeBrowser()
