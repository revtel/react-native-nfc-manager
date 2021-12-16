## iOS

1. In [apple developer site](https://developer.apple.com/), enable capability for NFC

![enable capability](./images/enable-capability.png "enable capability")

2. in Xcode, add `NFCReaderUsageDescription` into your `info.plist`, for example:

```
<key>NFCReaderUsageDescription</key>
<string>We need to use NFC</string>
```

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription?language=objc)

3. in Xcode's `Signing & Capabilities` tab, make sure `Near Field Communication Tag Reading` capability had been added, like this:

![xcode-add-capability](./images/xcode-capability.png "xcode capability")

If this is the first time you toggle the capabilities, the Xcode will generate a `<your-project>.entitlement` file for you:

![xcode-add-entitlement](./images/xcode-entitlement.png "xcode entitlement")

4. in Xcode, review the generated entitlement. It should look like this:

![edit entitlement](./images/edit-entitlement.png "edit entitlement")

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_nfc_readersession_formats?language=objc)

## Android

Update your `AndroidManifest.xml` to contain all of the required permissions and filters

```
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.lockchainmobi">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.NFC" /> <!--Add this line-->
    <uses-feature android:name="android.hardware.nfc" android:required="true" /> <!--Add this line to hide your app from NON-NFC devices in the Play Store-->

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme">
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize">
        <intent-filter>
          <action android:name="android.intent.action.MAIN" />
          <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
        <intent-filter> <!--Add From Here-->
          <action android:name="android.nfc.action.NDEF_DISCOVERED"/>
          <category android:name="android.intent.category.DEFAULT"/>
          <data android:mimeType="text/plain" />
        </intent-filter>
        <intent-filter>
          <action android:name="android.nfc.action.TAG_DISCOVERED" />
          <category android:name="android.intent.category.DEFAULT" />
        </intent-filter> <!--Until Here-->
      </activity>
    </application>
</manifest>
```