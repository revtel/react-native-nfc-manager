package community.revteltech.nfc;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.nfc.NfcAdapter;
import android.nfc.cardemulation.CardEmulation;
import android.nfc.cardemulation.HostApduService;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;
import org.json.JSONObject;

public class HceManager extends ReactContextBaseJavaModule {
    private static final String TAG = "HceManager";
    private final ReactApplicationContext reactContext;
    private final CardEmulation cardEmulation;
    private final NfcAdapter nfcAdapter;

    public HceManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.nfcAdapter = NfcAdapter.getDefaultAdapter(reactContext);
        this.cardEmulation = CardEmulation.getInstance(nfcAdapter);
    }

    @Override
    public String getName() {
        return "HceManager";
    }

    @ReactMethod
    public void isHceSupported(Promise promise) {
        if (nfcAdapter == null) {
            promise.resolve(false);
            return;
        }

        boolean isSupported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT &&
                nfcAdapter.isEnabled() &&
                cardEmulation != null;
        promise.resolve(isSupported);
    }

    @ReactMethod
    public void isHceEnabled(Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.resolve(false);
            return;
        }

        ComponentName serviceComponent = new ComponentName(reactContext, HceService.class);
        boolean isEnabled = cardEmulation.isDefaultServiceForCategory(serviceComponent, CardEmulation.CATEGORY_OTHER);
        promise.resolve(isEnabled);
    }

    @ReactMethod
    public void getRegisteredAids(Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        ComponentName serviceComponent = new ComponentName(reactContext, HceService.class);
        List<String> aids = cardEmulation.getAidsForService(serviceComponent, CardEmulation.CATEGORY_OTHER);
        
        WritableArray aidArray = Arguments.createArray();
        for (String aid : aids) {
            aidArray.pushString(aid);
        }
        
        promise.resolve(aidArray);
    }

    @ReactMethod
    public void registerAid(String aid, Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        ComponentName serviceComponent = new ComponentName(reactContext, HceService.class);
        boolean success = cardEmulation.addAidForService(serviceComponent, aid, CardEmulation.CATEGORY_OTHER);
        
        if (success) {
            promise.resolve(true);
        } else {
            promise.reject("REGISTRATION_FAILED", "Failed to register AID");
        }
    }

    @ReactMethod
    public void removeAid(String aid, Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        ComponentName serviceComponent = new ComponentName(reactContext, HceService.class);
        boolean success = cardEmulation.removeAidForService(serviceComponent, CardEmulation.CATEGORY_OTHER);
        
        if (success) {
            promise.resolve(true);
        } else {
            promise.reject("REMOVAL_FAILED", "Failed to remove AID");
        }
    }

    @ReactMethod
    public void setDefaultService(Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        ComponentName serviceComponent = new ComponentName(reactContext, HceService.class);
        boolean success = cardEmulation.setDefaultServiceForCategory(serviceComponent, CardEmulation.CATEGORY_OTHER);
        
        if (success) {
            promise.resolve(true);
        } else {
            promise.reject("SET_DEFAULT_FAILED", "Failed to set default service");
        }
    }

    @ReactMethod
    public void setSimpleUrl(String url, Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_SIMPLE_URL, url);
            reactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("URL_SET_FAILED", "Failed to set URL: " + e.getMessage());
        }
    }

    @ReactMethod
    public void setRichContent(String url, String title, String description, String imageUrl, Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            JSONObject richData = new JSONObject();
            richData.put("url", url);
            richData.put("title", title);
            richData.put("description", description);
            richData.put("imageUrl", imageUrl);
            richData.put("type", "rich_url");

            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_RICH_DATA, richData.toString());
            reactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("RICH_CONTENT_SET_FAILED", "Failed to set rich content: " + e.getMessage());
        }
    }

    @ReactMethod
    public void clearContent(Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_RICH_DATA, (String) null);
            intent.putExtra(HceService.EXTRA_SIMPLE_URL, (String) null);
            reactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CONTENT_CLEAR_FAILED", "Failed to clear content: " + e.getMessage());
        }
    }

    @ReactMethod
    public void setVCardData(String vcardData, Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_VCARD_DATA, vcardData);
            reactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VCARD_SET_FAILED", "Failed to set vCard data: " + e.getMessage());
        }
    }

    @ReactMethod
    public void clearVCardData(Promise promise) {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            promise.reject("NFC_NOT_ENABLED", "NFC is not enabled");
            return;
        }

        try {
            Intent intent = new Intent(HceService.ACTION_APDU_RECEIVED);
            intent.putExtra(HceService.EXTRA_VCARD_DATA, (String) null);
            reactContext.sendBroadcast(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VCARD_CLEAR_FAILED", "Failed to clear vCard data: " + e.getMessage());
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
} 