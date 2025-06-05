package community.revteltech.nfc;

import android.app.Activity;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.NfcManager;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NfcManagerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NfcManagerModule";
    private final ReactApplicationContext reactContext;
    private final NfcManager nfcManager;
    private final NfcAdapter nfcAdapter;
    private final HceManager hceManager;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            // Handle activity results if needed
        }
    };

    public NfcManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.nfcManager = (NfcManager) reactContext.getSystemService(reactContext.NFC_SERVICE);
        this.nfcAdapter = nfcManager.getDefaultAdapter();
        this.hceManager = new HceManager(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "NfcManager";
    }

    @ReactMethod
    public void isSupported(Promise promise) {
        if (nfcAdapter == null) {
            promise.resolve(false);
            return;
        }
        promise.resolve(true);
    }

    @ReactMethod
    public void isEnabled(Promise promise) {
        if (nfcAdapter == null) {
            promise.resolve(false);
            return;
        }
        promise.resolve(nfcAdapter.isEnabled());
    }

    @ReactMethod
    public void isHceSupported(Promise promise) {
        hceManager.isHceSupported(promise);
    }

    @ReactMethod
    public void isHceEnabled(Promise promise) {
        hceManager.isHceEnabled(promise);
    }

    @ReactMethod
    public void getRegisteredAids(Promise promise) {
        hceManager.getRegisteredAids(promise);
    }

    @ReactMethod
    public void registerAid(String aid, Promise promise) {
        hceManager.registerAid(aid, promise);
    }

    @ReactMethod
    public void removeAid(String aid, Promise promise) {
        hceManager.removeAid(aid, promise);
    }

    @ReactMethod
    public void setDefaultService(Promise promise) {
        hceManager.setDefaultService(promise);
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
} 