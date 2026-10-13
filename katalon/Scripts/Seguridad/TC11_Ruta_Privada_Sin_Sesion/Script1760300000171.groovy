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
 * TC11 - Ruta privada sin sesión redirige a /login (ESC07, negativo)
 * Datos: rutasPrivadas (lista con /proyectos, /cuenta y /checkout).
 * Resultado esperado: para cada ruta, sin sesión, el navegador termina en /login con el formulario visible.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')

for (String ruta : rutasPrivadas) {
	KeywordUtil.logInfo('Comprobando ruta privada: ' + ruta)

	// 1. Asegurar que no hay sesión
	CustomKeywords.'homara.Acciones.limpiarSesion'()

	// 2. Abrir la ruta privada directamente
	CustomKeywords.'homara.Acciones.navegarA'(ruta)

	// 3. Verificar la redirección al login
	CustomKeywords.'homara.Acciones.esperarUrl'('.*/login(\\?.*)?$')
	WebUI.verifyMatch(WebUI.getUrl(), '.*/login(\\?.*)?$', true)
	WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Login/input_Email'), t)
	WebUI.verifyElementVisible(findTestObject('Object Repository/Pagina_Login/btn_IniciarSesion'))
	WebUI.takeScreenshot()
}

WebUI.closeBrowser()
