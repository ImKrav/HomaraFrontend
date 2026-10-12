import static com.kms.katalon.core.checkpoint.CheckpointFactory.findCheckpoint
import static com.kms.katalon.core.testcase.TestCaseFactory.findTestCase
import static com.kms.katalon.core.testdata.TestDataFactory.findTestData
import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject

import com.kms.katalon.core.annotation.SetUp
import com.kms.katalon.core.annotation.SetupTestCase
import com.kms.katalon.core.annotation.TearDown
import com.kms.katalon.core.annotation.TearDownTestCase
import com.kms.katalon.core.model.FailureHandling as FailureHandling
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import internal.GlobalVariable as GlobalVariable

/**
 * Preparación y limpieza a nivel de Test Suite.
 * Cada caso de prueba abre y cierra su propio navegador; el listener
 * "Test Listeners/HomaraListener" cierra el navegador si un caso falla a mitad de camino.
 */

@SetUp(skipped = false)
def setUp() {
	KeywordUtil.logInfo('Ejecutando contra ' + GlobalVariable.baseUrl + ' (espera máxima ' + GlobalVariable.timeout + ' s)')
}

@TearDown(skipped = true)
def tearDown() {
}

@SetupTestCase(skipped = true)
def setupTestCase() {
}

@TearDownTestCase(skipped = true)
def tearDownTestCase() {
}
