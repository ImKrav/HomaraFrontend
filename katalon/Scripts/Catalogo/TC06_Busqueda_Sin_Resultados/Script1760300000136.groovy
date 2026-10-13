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
 * TC06 - Búsqueda sin resultados (ESC09, negativo)
 * Datos: termino, mensajeEsperado (Data File Busqueda_Sin_Resultados en las suites).
 * Resultado esperado: estado vacío "No se encontraron productos coincidentes", conteo 0 y sin tarjetas.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/catalogo')

// 1. Esperar a que el catálogo cargue productos
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/lnk_PrimerProducto'), t)

// 2. Buscar un término inexistente
WebUI.setText(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), termino)
WebUI.sendKeys(findTestObject('Object Repository/Pagina_Catalogo/input_Busqueda'), Keys.chord(Keys.ENTER))

// 3. Verificar el estado vacío
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Catalogo/h3_SinResultados'), t)
// El título se muestra en mayúsculas por CSS (text-transform: uppercase), por eso se compara sin distinguir mayúsculas
String mensajeVacio = WebUI.getText(findTestObject('Object Repository/Pagina_Catalogo/h3_SinResultados'))
WebUI.verifyMatch(mensajeVacio, '(?i)' + Pattern.quote(mensajeEsperado), true)
WebUI.verifyElementText(findTestObject('Object Repository/Pagina_Catalogo/p_ConteoResultados'), '0 productos técnicos encontrados')
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Pagina_Catalogo/lnk_PrimerProducto'), 2)
WebUI.takeScreenshot()

WebUI.closeBrowser()
