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
 * TC07 - Agregar al carrito y validar el total (ESC13, ESC16)
 * Precondición: cliente autenticado con el carrito vacío (se vacía al inicio).
 * Datos: terminoBusqueda, nombreProducto, precioEsperado, envioEsperado, totalEsperado.
 * Resultado esperado: toast "Producto agregado al carrito exitosamente"; en /carrito aparece el producto,
 * subtotal = precio, envío "Gratis" (compra >= 500.000 COP) y total = subtotal.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
CustomKeywords.'homara.Acciones.limpiarCarrito'()

// 1. Buscar el producto, abrir el detalle y agregarlo (incluye la verificación del toast)
CustomKeywords.'homara.Acciones.agregarProductoAlCarrito'(terminoBusqueda, nombreProducto)
WebUI.takeScreenshot()

// 2. Ir al carrito
CustomKeywords.'homara.Acciones.navegarA'('/carrito')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h1_TituloCarrito'), t)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_ItemPorNombre', [('nombre') : nombreProducto]), t)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pagina_Carrito/btn_EliminarItem'), t)

// 3. Validar subtotal, envío y total (formato es-CO: "$ 549.000"; \W? admite el espacio duro del formato)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/span_Total'), t)
String subtotal = WebUI.getText(findTestObject('Object Repository/Pagina_Carrito/span_Subtotal'))
String total = WebUI.getText(findTestObject('Object Repository/Pagina_Carrito/span_Total'))
KeywordUtil.logInfo('Subtotal: ' + subtotal + ' | Total: ' + total)
WebUI.verifyMatch(subtotal, '^\\$\\W?' + Pattern.quote(precioEsperado) + '$', true)
WebUI.verifyElementText(findTestObject('Object Repository/Pagina_Carrito/span_Envio'), envioEsperado)
WebUI.verifyMatch(total, '^\\$\\W?' + Pattern.quote(totalEsperado) + '$', true)
WebUI.verifyElementClickable(findTestObject('Object Repository/Pagina_Carrito/lnk_IrAPagar'))
WebUI.takeScreenshot()

WebUI.closeBrowser()
