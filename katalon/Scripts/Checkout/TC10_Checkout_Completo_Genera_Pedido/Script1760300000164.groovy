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
 * TC10 - Checkout completo genera pedido (ESC28)
 * Precondición: cliente autenticado; se vacía el carrito y se agrega un producto.
 * Datos: datos de contacto/envío y método de pago (variables del caso).
 * Resultado esperado: toast "¡Pedido realizado con éxito!", redirección a /proyectos y carrito vacío.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
CustomKeywords.'homara.Acciones.limpiarCarrito'()
CustomKeywords.'homara.Acciones.agregarProductoAlCarrito'(terminoBusqueda, nombreProducto)

// 1. Ir al carrito y pulsar "Ir a Pagar"
CustomKeywords.'homara.Acciones.navegarA'('/carrito')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_ItemPorNombre', [('nombre') : nombreProducto]), t)
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Carrito/lnk_IrAPagar'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Carrito/lnk_IrAPagar'))
CustomKeywords.'homara.Acciones.esperarUrl'('.*/checkout$')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Checkout/h1_Checkout'), t)

// 2. Diligenciar contacto y dirección de envío
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Checkout/input_Nombre'), t)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Nombre'), nombre)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Apellido'), apellido)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Email'), GlobalVariable.clienteEmail)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Telefono'), telefono)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Direccion'), direccion)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Ciudad'), ciudad)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_Departamento'), departamento)
WebUI.setText(findTestObject('Object Repository/Pagina_Checkout/input_CodigoPostal'), codigoPostal)

// 3. Elegir el método de pago
TestObject radioPago = findTestObject('Object Repository/Pagina_Checkout/radio_MetodoPago', [('metodo') : metodoPago])
WebUI.waitForElementClickable(radioPago, t)
WebUI.click(radioPago)
WebUI.verifyElementChecked(radioPago, t)
WebUI.takeScreenshot()

// 4. Pagar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Checkout/btn_Pagar'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Checkout/btn_Pagar'))

// 5. Verificar el toast de éxito y la redirección
TestObject toastExito = findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : mensajeExito])
WebUI.waitForElementVisible(toastExito, t)
WebUI.verifyElementVisible(toastExito)
WebUI.takeScreenshot()
CustomKeywords.'homara.Acciones.esperarUrl'('.*/proyectos$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/proyectos$', true)

// 6. El pedido vació el carrito
CustomKeywords.'homara.Acciones.navegarA'('/carrito')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'), t)
WebUI.verifyElementVisible(findTestObject('Object Repository/Pagina_Carrito/h3_CarritoVacio'))

WebUI.closeBrowser()
