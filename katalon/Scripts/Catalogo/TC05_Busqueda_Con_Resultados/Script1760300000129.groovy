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
 * TC05 - Búsqueda con resultados (ESC09)
 * Datos: termino, minimoResultados (Data File Busqueda_Con_Resultados en las suites).
 * Resultado esperado: aparece "Resultados para: "<termino>"", al menos una tarjeta de producto
 * y el conteo de productos es mayor o igual al mínimo esperado.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/catalogo')

// 1. Esperar a que el catálogo cargue productos
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/lnk_PrimerProducto'), t)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pagina_Catalogo/select_Calificacion'), t)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pagina_Catalogo/select_OrdenarPor'), t)

// 2. Buscar el término (la búsqueda se aplica al presionar Enter)
WebUI.setText(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), termino)
WebUI.sendKeys(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), Keys.chord(Keys.ENTER))

// 3. Verificar el resumen de la búsqueda
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/span_ResultadosPara'), t)
String resumen = WebUI.getText(findTestObject('Object Repository/Pagina_Catalogo/span_ResultadosPara'))
WebUI.verifyMatch(resumen, '.*' + Pattern.quote('"' + termino + '"') + '.*', true)

// 4. Verificar el conteo y que hay tarjetas de producto
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/p_ConteoResultados'), t)
String conteo = WebUI.getText(findTestObject('Object Repository/Pagina_Catalogo/p_ConteoResultados'))
WebUI.verifyMatch(conteo, '^\\d+ productos técnicos encontrados$', true)
int encontrados = conteo.replaceAll('[^0-9]', '') as int
KeywordUtil.logInfo('Búsqueda "' + termino + '": ' + encontrados + ' productos')
WebUI.verifyGreaterThanOrEqual(encontrados, minimoResultados as int)
WebUI.verifyElementVisible(findTestObject('Object Repository/Pagina_Catalogo/lnk_PrimerProducto'))
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pagina_Catalogo/h3_SinResultados'), 2)
WebUI.takeScreenshot()

WebUI.closeBrowser()
