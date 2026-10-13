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
 * TC13 - El administrador crea y elimina un producto (ESC32)
 * Precondición: sesión iniciada con el usuario ADMIN.
 * Datos: prefijoNombre (se agrega una marca de tiempo), descripcion, unidad, precio, stock.
 * Resultado esperado: toast "Producto guardado correctamente", el producto aparece en la tabla;
 * tras eliminarlo, toast "Producto eliminado correctamente" y la fila desaparece.
 */
int t = GlobalVariable.timeout
String nombreProducto = prefijoNombre + ' ' + System.currentTimeMillis()
KeywordUtil.logInfo('Producto de prueba: ' + nombreProducto)

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.adminEmail, GlobalVariable.adminPassword)

// 1. El administrador ve la opción Panel Admin
WebUI.waitForElementClickable(findTestObject('Object Repository/Navbar/btn_MenuUsuario'), t)
WebUI.click(findTestObject('Object Repository/Navbar/btn_MenuUsuario'))
WebUI.waitForElementVisible(findTestObject('Object Repository/Navbar/lnk_PanelAdmin'), t)
WebUI.click(findTestObject('Object Repository/Navbar/lnk_PanelAdmin'))
CustomKeywords.'homara.Acciones.esperarUrl'('.*/admin$')

// 2. Ir a la gestión de productos
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Admin_Productos/lnk_MenuProductos'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Admin_Productos/lnk_MenuProductos'))
CustomKeywords.'homara.Acciones.esperarUrl'('.*/admin/productos$')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Admin_Productos/h1_Productos'), t)

// 3. Abrir el formulario y diligenciarlo
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Admin_Productos/btn_AgregarProducto'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Admin_Productos/btn_AgregarProducto'))
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Admin_Productos/input_Nombre'), t)
WebUI.setText(findTestObject('Object Repository/Pagina_Admin_Productos/input_Nombre'), nombreProducto)
WebUI.setText(findTestObject('Object Repository/Pagina_Admin_Productos/textarea_Descripcion'), descripcion)
WebUI.waitForElementPresent(findTestObject('Object Repository/Pagina_Admin_Productos/option_PrimeraCategoria'), t)
WebUI.selectOptionByIndex(findTestObject('Object Repository/Pagina_Admin_Productos/select_Categoria'), 1)
WebUI.selectOptionByValue(findTestObject('Object Repository/Pagina_Admin_Productos/select_Unidad'), unidad, false)
WebUI.setText(findTestObject('Object Repository/Pagina_Admin_Productos/input_Precio'), precio)
WebUI.setText(findTestObject('Object Repository/Pagina_Admin_Productos/input_Stock'), stock)
WebUI.takeScreenshot()

// 4. Guardar y verificar
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Admin_Productos/btn_GuardarProducto'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Admin_Productos/btn_GuardarProducto'))
WebUI.waitForElementVisible(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Producto guardado correctamente']), t)
WebUI.verifyElementVisible(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Producto guardado correctamente']))

// 5. Buscar el producto creado en la tabla
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Admin_Productos/input_BuscarProducto'), t)
WebUI.setText(findTestObject('Object Repository/Pagina_Admin_Productos/input_BuscarProducto'), nombreProducto)
TestObject fila = findTestObject('Object Repository/Pagina_Admin_Productos/span_ProductoPorNombre', [('nombre') : nombreProducto])
WebUI.waitForElementVisible(fila, t)
WebUI.verifyElementText(fila, nombreProducto)
WebUI.takeScreenshot()

// 6. Eliminar el producto y confirmar
TestObject eliminar = findTestObject('Object Repository/Pagina_Admin_Productos/btn_EliminarProductoPorNombre', [('nombre') : nombreProducto])
WebUI.waitForElementClickable(eliminar, t)
WebUI.click(eliminar)
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Admin_Productos/btn_ConfirmarEliminar'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Admin_Productos/btn_ConfirmarEliminar'))

// 7. Verificar la eliminación
WebUI.waitForElementVisible(findTestObject('Object Repository/Comunes/div_Toast', [('mensaje') : 'Producto eliminado correctamente']), t)
WebUI.waitForElementNotPresent(fila, t)
WebUI.verifyElementNotPresent(fila, t)
WebUI.takeScreenshot()

WebUI.closeBrowser()
