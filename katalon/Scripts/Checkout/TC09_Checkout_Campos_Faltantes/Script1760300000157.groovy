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
 * TC09 - Checkout con campos faltantes (ESC27, negativo)
 * Precondición: cliente autenticado con un producto en el carrito.
 * Pasos: en /checkout se borran Dirección y Ciudad (obligatorios) y se pulsa Pagar.
 * Resultado esperado: el formulario no se envía (validación "required" del navegador marca los campos
 * como faltantes), no aparece el toast de pedido exitoso y se permanece en /checkout.
 * Nota: los campos se borran con Ctrl+A + Retroceso para que React registre el cambio.
 */
int t = GlobalVariable.timeout

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)
CustomKeywords.'homara.Acciones.limpiarCarrito'()
CustomKeywords.'homara.Acciones.agregarProductoAlCarrito'(terminoBusqueda, nombreProducto)

// 1. Abrir el checkout (los datos se precargan desde el perfil del usuario)
CustomKeywords.'homara.Acciones.navegarA'('/checkout')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Checkout/h1_Checkout'), t)
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Checkout/input_Direccion'), t)

// 2. Vaciar Dirección y Ciudad
for (String campo : ['Object Repository/Pagina_Checkout/input_Direccion', 'Object Repository/Pagina_Checkout/input_Ciudad']) {
	WebUI.click(findTestObject(campo))
	WebUI.sendKeys(findTestObject(campo), Keys.chord(Keys.CONTROL, 'a'))
	WebUI.sendKeys(findTestObject(campo), Keys.chord(Keys.BACK_SPACE))
	WebUI.verifyElementAttributeValue(findTestObject(campo), 'value', '', t)
}

// 3. Intentar pagar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Checkout/btn_Pagar'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Checkout/btn_Pagar'))
WebUI.takeScreenshot()

// 4. Verificar que el formulario no se envió
boolean direccionFaltante = WebUI.executeJavaScript("return document.querySelector('#address').validity.valueMissing;", null)
boolean ciudadFaltante = WebUI.executeJavaScript("return document.querySelector('#city').validity.valueMissing;", null)
String mensajeNavegador = WebUI.executeJavaScript("return document.querySelector('#address').validationMessage;", null)
KeywordUtil.logInfo('Mensaje de validación del navegador: ' + mensajeNavegador)
WebUI.verifyEqual(direccionFaltante, true)
WebUI.verifyEqual(ciudadFaltante, true)
WebUI.verifyNotEqual(mensajeNavegador, '')
WebUI.verifyElementNotPresent(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Pedido realizado con éxito']), 3)
WebUI.verifyMatch(WebUI.getUrl(), '.*/checkout$', true)
WebUI.verifyElementVisible(findTestObject('Object Repository/Pagina_Checkout/h1_Checkout'))

// 5. Dejar el carrito limpio para los siguientes casos
CustomKeywords.'homara.Acciones.limpiarCarrito'()

WebUI.closeBrowser()
