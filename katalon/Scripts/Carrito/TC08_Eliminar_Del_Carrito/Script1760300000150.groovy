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
 * TC08 - Eliminar del carrito (ESC15)
 * Precondición: cliente autenticado; se vacía el carrito y se agrega un producto.
 * Datos: terminoBusqueda, nombreProducto.
 * Resultado esperado: tras pulsar eliminar, el producto desaparece y se muestra "Tu carrito está vacío".
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
CustomKeywords.'homara.Acciones.limpiarCarrito'()
CustomKeywords.'homara.Acciones.agregarProductoAlCarrito'(terminoBusqueda, nombreProducto)

// 1. Ir al carrito y comprobar que el producto está
CustomKeywords.'homara.Acciones.navegarA'('/carrito')
TestObject item = findTestObject('Object Repository/Pagina_Carrito/h3_ItemPorNombre', [('nombre') : nombreProducto])
WebUI.waitForElementVisible(item, t)
WebUI.takeScreenshot()

// 2. Eliminar el producto
TestObject eliminar = findTestObject('Object Repository/Pagina_Carrito/btn_EliminarItemPorNombre', [('nombre') : nombreProducto])
WebUI.waitForElementClickable(eliminar, t)
WebUI.click(eliminar)

// 3. Verificar que desapareció y que el carrito quedó vacío
WebUI.waitForElementNotPresent(item, t)
WebUI.verifyElementNotPresent(item, t)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'), t)
WebUI.verifyElementText(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'), 'Tu carrito está vacío')
WebUI.takeScreenshot()

WebUI.closeBrowser()
