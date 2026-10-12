import com.kms.katalon.core.annotation.AfterTestCase
import com.kms.katalon.core.annotation.BeforeTestCase
import com.kms.katalon.core.context.TestCaseContext
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Listener del proyecto Homara.
 * - Registra en el log el caso que inicia.
 * - Al terminar cada caso, si falló, toma una captura de pantalla como evidencia
 *   y cierra el navegador para que el siguiente caso arranque limpio.
 */
class HomaraListener {

	@BeforeTestCase
	def antesDelCaso(TestCaseContext testCaseContext) {
		KeywordUtil.logInfo('Iniciando ' + testCaseContext.getTestCaseId())
	}

	@AfterTestCase
	def despuesDelCaso(TestCaseContext testCaseContext) {
		String estado = testCaseContext.getTestCaseStatus()
		KeywordUtil.logInfo('Finalizó ' + testCaseContext.getTestCaseId() + ' con estado ' + estado)
		if (estado == 'FAILED' || estado == 'ERROR') {
			WebUI.takeScreenshot(FailureHandling.OPTIONAL)
		}
		WebUI.closeBrowser(FailureHandling.OPTIONAL)
	}
}
