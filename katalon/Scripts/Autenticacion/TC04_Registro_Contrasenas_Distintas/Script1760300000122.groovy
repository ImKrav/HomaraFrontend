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
 * TC04 - Registro con contraseñas distintas (ESC01, negativo)
 * Datos: nombre, apellido, prefijoEmail, password, confirmacion, mensajeEsperado
 * (Data File Registro_Contrasenas_Distintas en las suites).
 * Resultado esperado: mensaje "Las contraseñas no coinciden.", sin sesión y se permanece en /register.
 */
int t = GlobalVariable.timeout
String emailUnico = prefijoEmail + '.' + System.currentTimeMillis() + '@homara.co'

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.limpiarSesion'()

// 1. Abrir el formulario de registro
CustomKeywords.'homara.Acciones.navegarA'('/register')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Registro/input_Nombre'), t)

// 2. Diligenciar con una confirmación distinta
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Nombre'), nombre)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Apellido'), apellido)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Email'), emailUnico)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_Password'), password)
WebUI.setText(findTestObject('Object Repository/Pagina_Registro/input_ConfirmarPassword'), confirmacion)

// 3. Enviar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Registro/btn_Registrarme'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Registro/btn_Registrarme'))

// 4. Verificar el mensaje y que no se creó la sesión
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Registro/div_MensajeError'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Pagina_Registro/div_MensajeError'), mensajeEsperado)
WebUI.takeScreenshot()
WebUI.verifyMatch(WebUI.getUrl(), '.*/register$', true)
String token = CustomKeywords.'homara.Acciones.leerLocalStorage'('homara_token')
WebUI.verifyEqual(token, null)

WebUI.closeBrowser()
