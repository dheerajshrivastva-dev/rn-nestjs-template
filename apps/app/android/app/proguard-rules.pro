# ──────────────────────────────────────────────────────────────────────────────
# React Native / Hermes
# ──────────────────────────────────────────────────────────────────────────────

# Keep the RN entry point and bridge classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# JS-to-Java bridge annotations (used by Hermes and the old JSC bridge)
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

# Native modules registered by name — keep their constructors
-keepclassmembers,allowobfuscation class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    public <init>(com.facebook.react.bridge.ReactApplicationContext);
}

# ──────────────────────────────────────────────────────────────────────────────
# Firebase (Google Services)
# ──────────────────────────────────────────────────────────────────────────────

-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ──────────────────────────────────────────────────────────────────────────────
# OkHttp / Okio (used by React Native networking)
# ──────────────────────────────────────────────────────────────────────────────

-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ──────────────────────────────────────────────────────────────────────────────
# Kotlin
# ──────────────────────────────────────────────────────────────────────────────

-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Lazy {
    public *;
}

# ──────────────────────────────────────────────────────────────────────────────
# Android / Java standard
# ──────────────────────────────────────────────────────────────────────────────

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep R classes (resources referenced by name)
-keepclassmembers class **.R$* {
    public static <fields>;
}

# ──────────────────────────────────────────────────────────────────────────────
# Suppress noisy warnings from vendored libs
# ──────────────────────────────────────────────────────────────────────────────

-dontwarn sun.misc.**
-dontwarn java.lang.invoke.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
