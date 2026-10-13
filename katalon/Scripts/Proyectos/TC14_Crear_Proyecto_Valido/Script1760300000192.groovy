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
 * TC14 - Crear proyecto válido (ESC17)
 * Precondición: cliente autenticado.
 * Datos: prefijoNombre (se agrega una marca de tiempo), largo, ancho. Tipo de superficie por defecto: Piso.
 * Resultado esperado: se guarda el proyecto y se navega a /proyectos/{id} mostrando el nombre ingresado.
 * Nota: la app muestra un toast y recarga la página de inmediato (window.location), por eso la
 * verificación se hace sobre la URL y el título del detalle y no sobre el toast.
 */
int t = GlobalVariable.timeout
String nombreProyecto = prefijoNombre + ' ' + System.currentTimeMillis()

CustomKeywords.'homara.Acciones.abrirNavegador'('/')
CustomKeywords.'homara.Acciones.iniciarSesion'(GlobalVariable.clienteEmail, GlobalVariable.clientePassword)

// 1. Abrir el formulario de nuevo proyecto
CustomKeywords.'homara.Acciones.navegarA'('/proyectos/nuevo')
WebUI.waitForElementVisible(findTestObject('Object Repository/Pagina_Proyecto/input_NombreProyecto'), t)

// 2. Diligenciar nombre y dimensiones (piso: largo y ancho obligatorios, alto opcional)
WebUI.setText(findTestObject('Object Repository/Pagina_Proyecto/input_NombreProyecto'), nombreProyecto)
WebUI.setText(findTestObject('Object Repository/Pagina_Proyecto/input_Largo'), largo)
WebUI.setText(findTestObject('Object Repository/Pagina_Proyecto/input_Ancho'), ancho)
WebUI.verifyElementPresent(findTestObject('Object Repository/Pagina_Proyecto/input_Alto'), t)
WebUI.takeScreenshot()

// 3. Guardar y calcular
WebUI.waitForElementClickable(findTestObject('Object Repository/Pagina_Proyecto/btn_GuardarYCalcular'), t)
WebUI.click(findTestObject('Object Repository/Pagina_Proyecto/btn_GuardarYCalcular'))

// 4. Verificar el detalle del proyecto creado
CustomKeywords.'homara.Acciones.esperarUrl'('.*/proyectos/(?!nuevo)[A-Za-z0-9_-]+$')
WebUI.verifyMatch(WebUI.getUrl(), '.*/proyectos/(?!nuevo)[A-Za-z0-9_-]+$', true)
TestObject titulo = findTestObject('Object Repository/Pagina_Proyecto/h1_NombreProyecto', [('nombre') : nombreProyecto])
WebUI.waitForElementVisible(titulo, t)
WebUI.verifyElementText(titulo, nombreProyecto)
WebUI.takeScreenshot()

WebUI.closeBrowser()
