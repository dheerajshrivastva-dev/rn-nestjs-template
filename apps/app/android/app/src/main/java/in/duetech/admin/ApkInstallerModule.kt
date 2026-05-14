package `in`.duetech.admin

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ApkInstallerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ApkInstaller"

    /**
     * Returns true if the app already has the "Install unknown apps" permission.
     */
    @ReactMethod
    fun canInstallApks(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            promise.resolve(reactContext.packageManager.canRequestPackageInstalls())
        } else {
            promise.resolve(true)
        }
    }

    /**
     * Opens Android Settings so the user can grant "Install unknown apps" for this app.
     */
    @ReactMethod
    fun openInstallPermissionSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${reactContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true) // Not needed below API 26
            }
        } catch (e: Exception) {
            promise.reject("SETTINGS_ERROR", e.message)
        }
    }

    /**
     * Fires the Android package installer intent for the given APK file path.
     * Uses FileProvider for Android 7+ (API 24+).
     */
    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val file = File(filePath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found: $filePath")
                return
            }

            val apkUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(
                    reactContext,
                    "${reactContext.packageName}.provider",
                    file,
                )
            } else {
                Uri.fromFile(file)
            }

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INSTALL_ERROR", e.message)
        }
    }
}
