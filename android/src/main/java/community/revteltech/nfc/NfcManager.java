package community.revteltech.nfc;

import static community.revteltech.nfc.NfcErrorCodes.*;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import android.util.Log;
import android.provider.Settings;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

import android.app.PendingIntent;
import android.content.IntentFilter.MalformedMimeTypeException;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Bundle;
import android.os.Parcelable;

import java.util.*;

class NfcManager extends NfcManagerIOSStubBase implements ActivityEventListener, LifecycleEventListener {
    private static final String LOG_TAG = "ReactNativeNfcManager";
    private final List<IntentFilter> intentFilters = new ArrayList<>();
    private final ArrayList<String[]> techLists = new ArrayList<>();
    private Boolean isForegroundEnabled = false;
    private Boolean isResumed = false;
    private NdefHandler.WriteNdefRequest writeNdefRequest = null;
    private TagTechnologyRequest techRequest = null;
    private Tag tag = null;
    private WritableMap bgTag = null;
    private Activity receiverActivity = null;
    // Use NFC reader mode instead of listening to a dispatch
    private Boolean isReaderModeEnabled = false;
    private int readerModeFlags = 0;
    private int readerModeDelay = 0;
    private final NfcAdapterStateChangedReceiver mReceiver =
            new NfcAdapterStateChangedReceiver(LOG_TAG, this::emitAdapterStateChanged);

    public NfcManager(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
        reactContext.addLifecycleEventListener(this);
        Log.d(LOG_TAG, "NfcManager created");
    }

    @NonNull
    @Override
    public String getName() {
        return "NfcManager";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();

        MifareClassicHandler.putConstants(constants);
        MifareUltralightHandler.putConstants(constants);

        return constants;
    }

    @ReactMethod
    public void cancelTechnologyRequest(Callback callback) {
        synchronized(this) {
            TagTechnologyRequest request = detachTechnologyRequest();
            if (request != null) {
                request.close();
                try {
                    request.invokePendingCallbackWithError(ERR_CANCEL);
                } catch (RuntimeException ex) {
                    Log.w(LOG_TAG, "fail to complete cancelled technology request", ex);
                }
            }
            callback.invoke();
        }
    }

    @ReactMethod
    public void requestTechnology(ReadableArray techs, ReadableMap options, Callback callback) {
        synchronized(this) {
            if (!isForegroundEnabled) {
                callback.invoke(ERR_NOT_REGISTERED);
                return;
            }

            if (hasPendingRequest()) {
                callback.invoke(ERR_MULTI_REQ);
            } else {
                techRequest = new TagTechnologyRequest(techs.toArrayList(), callback);
            }
        }
    }

    @ReactMethod
    public void closeTechnology(Callback callback) {
        synchronized(this) {
            TagTechnologyRequest request = detachTechnologyRequest();
            if (request != null) {
                request.close();
                try {
                    request.invokePendingCallbackWithError(ERR_CANCEL);
                } catch (RuntimeException ex) {
                    Log.w(LOG_TAG, "fail to complete closed technology request", ex);
                }
            }
            callback.invoke();
        }
    }

    @ReactMethod
    public void getTag(Callback callback) {
        synchronized (this) {
            if (techRequest != null) {
                Tag tag = techRequest.getTagHandle();
                if (tag != null) {
                    WritableMap parsed = Util.tagToReact(tag);
                    if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                        try {
                            parsed = NdefHandler.ndefToReact(tag);
                        } catch (Exception ex) {
                            Log.d(LOG_TAG, ex.toString());
                        }
                    }
                    callback.invoke(null, parsed);
                } else {
                    callback.invoke(ERR_NO_REFERENCE);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void getCachedNdefMessage(Callback callback) {
        synchronized(this) {
            NdefHandler.getCachedNdefMessage(techRequest, callback);
        }
    }

    @ReactMethod
    public void getNdefMessage(Callback callback) {
        synchronized(this) {
            NdefHandler.getNdefMessage(techRequest, callback);
        }
    }

    @ReactMethod
    public void queryNdefStatus(Callback callback) {
        synchronized(this) {
            NdefHandler.queryNdefStatus(techRequest, callback);
        }
    }

    @ReactMethod
    public void writeNdefMessage(ReadableArray rnArray, ReadableMap options, Callback callback) {
        synchronized(this) {
            NdefHandler.writeNdefMessage(
                    techRequest,
                    rnArray,
                    options,
                    callback
            );
        }
    }

    @ReactMethod
    public void formatNdef(ReadableArray rnArray, ReadableMap options, Callback callback) {
        synchronized(this) {
            NdefHandler.formatNdef(
                    techRequest,
                    rnArray,
                    options,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicAuthenticateA(double sector, ReadableArray key, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.authenticate(techRequest, 'A', (int)sector, key, callback);
        }
    }

    @ReactMethod
    public void mifareClassicAuthenticateB(double sector, ReadableArray key, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.authenticate(techRequest, 'B', (int)sector, key, callback);
        }
    }

    @ReactMethod
    public void mifareClassicGetBlockCountInSector(double _sectorIndex, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.getBlockCountInSector(
                    techRequest,
                    (int)_sectorIndex,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicGetSectorCount(Callback callback) {
        synchronized(this) {
            MifareClassicHandler.getSectorCount(techRequest, callback);
        }
    }

    @ReactMethod
    public void mifareClassicSectorToBlock(double _sectorIndex, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.sectorToBlock(
                    techRequest,
                    (int)_sectorIndex,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicReadBlock(double _blockIndex, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.readBlock(
                    techRequest,
                    (int)_blockIndex,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicReadSector(double _sectorIndex, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.readSector(
                    techRequest,
                    (int)_sectorIndex,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicWriteBlock(double _blockIndex, ReadableArray block, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.writeBlock(
                    techRequest,
                    (int)_blockIndex,
                    block,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicIncrementBlock(double _blockIndex, double _value, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.incrementBlock(
                    techRequest,
                    (int)_blockIndex,
                    (int)_value,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicDecrementBlock(double _blockIndex, double _value, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.decrementBlock(
                    techRequest,
                    (int)_blockIndex,
                    (int)_value,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareClassicTransferBlock(double _blockIndex, Callback callback) {
        synchronized(this) {
            MifareClassicHandler.transferBlock(
                    techRequest,
                    (int)_blockIndex,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareUltralightReadPages(double pageOffset, Callback callback) {
        synchronized(this) {
            MifareUltralightHandler.readPages(
                    techRequest,
                    (int)pageOffset,
                    callback
            );
        }
    }

    @ReactMethod
    public void mifareUltralightWritePage(double pageOffset, ReadableArray rnArray, Callback callback) {
        synchronized(this) {
            MifareUltralightHandler.writePage(
                    techRequest,
                    (int)pageOffset,
                    rnArray,
                    callback
            );
        }
    }

    @ReactMethod
    public void makeReadOnly(Callback callback) {
        synchronized(this) {
            NdefHandler.makeReadOnly(techRequest, callback);
        }
    }

    @ReactMethod
    public void setTimeout(double timeout, Callback callback) {
        synchronized (this) {
            NfcTechIoRouter.setTimeout(
                    techRequest,
                    (int)timeout,
                    callback
            );
        }
    }

    @ReactMethod
    public void getTimeout(Callback callback) {
        synchronized (this) {
            NfcTechIoRouter.getTimeout(techRequest, callback);
        }
    }

    @ReactMethod
    public void connect(ReadableArray techs, Callback callback){
        synchronized(this) {
            if (hasPendingRequest()) {
                callback.invoke(ERR_MULTI_REQ);
                return;
            }

            TagTechnologyRequest request = new TagTechnologyRequest(techs.toArrayList(), null);
            try {
                if (!request.connect(this.tag)) {
                    request.close();
                    callback.invoke(this.tag == null ? ERR_NO_REFERENCE : ERR_API_NOT_SUPPORT);
                    return;
                }
                techRequest = request;
            } catch (Exception ex) {
                callback.invoke(ex.toString());
                return;
            }
            callback.invoke(null, null);
        }
    }

    @ReactMethod
    public void close(Callback callback){
        synchronized(this) {
            TagTechnologyRequest request = detachTechnologyRequest();
            if (request == null) {
                callback.invoke(ERR_NO_TECH_REQ);
                return;
            }

            request.close();
            try {
                request.invokePendingCallbackWithError(ERR_CANCEL);
            } catch (RuntimeException ex) {
                Log.w(LOG_TAG, "fail to complete closed technology request", ex);
            }
            callback.invoke(null, null);
        }
    }

    @ReactMethod
    public void transceive(ReadableArray rnArray, Callback callback) {
        synchronized(this) {
            NfcTechIoRouter.transceive(
                    techRequest,
                    rnArray,
                    callback
            );
        }
    }

    @ReactMethod
    public void getMaxTransceiveLength(Callback callback) {
        synchronized(this) {
            NfcTechIoRouter.getMaxTransceiveLength(techRequest, callback);
        }
    }

    @ReactMethod
    public void cancelNdefWrite(Callback callback) {
        synchronized(this) {
            writeNdefRequest = NdefHandler.cancelNdefWrite(writeNdefRequest, callback);
        }
    }

    @ReactMethod
    public void requestNdefWrite(ReadableArray rnArray, ReadableMap options, Callback callback) {
        synchronized(this) {
            writeNdefRequest = NdefHandler.requestNdefWrite(
                    rnArray,
                    options,
                    isForegroundEnabled,
                    hasPendingRequest(),
                    writeNdefRequest,
                    callback
            );
        }
    }

    @ReactMethod
    public void start(Callback callback) {
        synchronized(this) {
            var context = getReactApplicationContext();
            NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(context);
            if (nfcAdapter == null) {
                Log.d(LOG_TAG, "not support in this device");
                callback.invoke(ERR_NO_NFC_SUPPORT);
                return;
            }

            Log.d(LOG_TAG, "start");
            Activity currentActivity = context.getCurrentActivity();
            if (currentActivity == null) {
                callback.invoke(ERR_GET_ACTIVITY_FAIL);
                return;
            }

            try {
                if (receiverActivity == null) {
                    IntentFilter filter = new IntentFilter(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED);
                    currentActivity.registerReceiver(mReceiver, filter);
                    receiverActivity = currentActivity;
                }
                Intent launchIntent = currentActivity.getIntent();
                // we consider the launching intent to be background
                bgTag = parseNfcIntent(launchIntent);
            } catch (Exception ex) {
                callback.invoke(ex.toString());
                return;
            }
            callback.invoke();
        }
    }

    @ReactMethod
    public void isSupported(String tech, Callback callback){
        Log.d(LOG_TAG, "isSupported");
        Activity currentActivity = getReactApplicationContext().getCurrentActivity();
        if (currentActivity == null) {
            callback.invoke(ERR_GET_ACTIVITY_FAIL);
            return;
        }

        if (!currentActivity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_NFC)) {
            callback.invoke(null, false);
            return;
        }

        // If we ask for MifareClassic support, so some extra checks, since not all chips and devices are
        // compatible with MifareClassic
        // TODO: Check if it's the same case with MifareUltralight
        if (tech.equals("MifareClassic")) {
            if (!Util.isDeviceSupported(currentActivity)) {
                callback.invoke(null, false);
                return;
            }
        }

        callback.invoke(null, true);
    }

    @ReactMethod
    public void isEnabled(Callback callback) {
        Log.d(LOG_TAG, "isEnabled");
        NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(getReactApplicationContext());
        if (nfcAdapter != null) {
            callback.invoke(null, nfcAdapter.isEnabled());
        } else {
            callback.invoke(null, false);
        }
    }

    @ReactMethod
    public void goToNfcSetting(Callback callback) {
        Log.d(LOG_TAG, "goToNfcSetting");
        Activity currentActivity = getReactApplicationContext().getCurrentActivity();
        if (currentActivity == null) {
            callback.invoke(ERR_GET_ACTIVITY_FAIL);
            return;
        }

        try {
            currentActivity.startActivity(new Intent(Settings.ACTION_NFC_SETTINGS));
            callback.invoke(null, true);
        } catch (Exception ex) {
            callback.invoke(null, false);
        }
    }

    @ReactMethod
    public void getLaunchTagEvent(Callback callback) {
        Activity currentActivity = getReactApplicationContext().getCurrentActivity();
        if (currentActivity == null) {
            callback.invoke(ERR_GET_ACTIVITY_FAIL);
            return;
        }

        Intent launchIntent = currentActivity.getIntent();
        WritableMap nfcTag = parseNfcIntent(launchIntent);
        callback.invoke(null, nfcTag);
    }

    @ReactMethod
    public void getBackgroundTag(Callback callback) {
        callback.invoke(null, bgTag);
    }

    @ReactMethod
    public void clearBackgroundTag(Callback callback) {
        bgTag = null;
        callback.invoke();
    }

    @ReactMethod
    public void registerTagEvent(ReadableMap options, Callback callback) {
        synchronized(this) {
            Log.d(LOG_TAG, "registerTagEvent");
            IntentFilter ndef = new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED);
            try {
                // capture all mime-based dispatch NDEF
                ndef.addDataType("*/*");
            } catch (MalformedMimeTypeException ex) {
                callback.invoke(ex.toString());
                return;
            }

            intentFilters.clear();
            techLists.clear();
            intentFilters.add(ndef);
            // capture all rest NDEF, such as uri-based
            intentFilters.add(new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED));
            techLists.add(new String[]{Ndef.class.getName()});
            // for those without NDEF, get them as tags
            intentFilters.add(new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED));

            isReaderModeEnabled = options.getBoolean("isReaderModeEnabled");
            readerModeFlags = options.getInt("readerModeFlags");
            readerModeDelay = options.getInt("readerModeDelay");
            isForegroundEnabled = true;

            if (isResumed) {
                enableDisableForegroundDispatch(true);
            }
            callback.invoke();
        }
    }

    @ReactMethod
    public void unregisterTagEvent(Callback callback) {
        synchronized(this) {
            Log.d(LOG_TAG, "unregisterTagEvent");
            resetTagRegistration();
            callback.invoke();
        }
    }

    @ReactMethod
    public void hasTagEventRegistration(Callback callback) {
        Log.d(LOG_TAG, "isSessionAvailable: " + isForegroundEnabled);
        callback.invoke(null, isForegroundEnabled);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(double count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @Override
    public void onHostResume() {
        Log.d(LOG_TAG, "onResume");
        isResumed = true;
        if (isForegroundEnabled) {
            enableDisableForegroundDispatch(true);
        }
    }

    @Override
    public void onHostPause() {
        Log.d(LOG_TAG, "onPause");
        isResumed = false;
        enableDisableForegroundDispatch(false);
    }

    @Override
    public void onHostDestroy() {
        Log.d(LOG_TAG, "onDestroy");
        cleanUpNativeState();
    }

    @Override
    public void invalidate() {
        cleanUpNativeState();
        ReactApplicationContext context = getReactApplicationContext();
        context.removeActivityEventListener(this);
        context.removeLifecycleEventListener(this);
        super.invalidate();
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        Log.d(LOG_TAG, "onActivityResult");
    }

    @Override
    public void onNewIntent(Intent intent) {
        Log.d(LOG_TAG, "onNewIntent " + intent);
        WritableMap nfcTag = parseNfcIntent(intent);
        if (nfcTag != null) {
            if (isForegroundEnabled) {
                sendEvent("NfcManagerDiscoverTag", nfcTag);
            } else {
                sendEvent("NfcManagerDiscoverBackgroundTag", nfcTag);
                bgTag = nfcTag;
            }
        }
    }

    private boolean hasPendingRequest() {
        return writeNdefRequest != null || techRequest != null;
    }

    private TagTechnologyRequest detachTechnologyRequest() {
        TagTechnologyRequest request = techRequest;
        techRequest = null;
        return request;
    }

    private void resetTagRegistration() {
        if (isResumed) {
            enableDisableForegroundDispatch(false);
        }
        intentFilters.clear();
        techLists.clear();
        isForegroundEnabled = false;
        isReaderModeEnabled = false;
        readerModeFlags = 0;
        readerModeDelay = 0;
    }

    private void cleanUpNativeState() {
        synchronized(this) {
            resetTagRegistration();
            isResumed = false;

            TagTechnologyRequest request = detachTechnologyRequest();
            if (request != null) {
                request.close();
                try {
                    request.invokePendingCallbackWithError(ERR_CANCEL);
                } catch (RuntimeException ex) {
                    Log.w(LOG_TAG, "fail to complete destroyed technology request", ex);
                }
            }

            NdefHandler.WriteNdefRequest ndefRequest = writeNdefRequest;
            writeNdefRequest = null;
            if (ndefRequest != null) {
                try {
                    ndefRequest.invokeCallbackWithError(ERR_CANCEL);
                } catch (RuntimeException ex) {
                    Log.w(LOG_TAG, "fail to complete destroyed NDEF request", ex);
                }
            }

            if (receiverActivity != null) {
                try {
                    receiverActivity.unregisterReceiver(mReceiver);
                } catch (IllegalArgumentException ex) {
                    Log.w(LOG_TAG, "adapter-state receiver was already unregistered", ex);
                }
                receiverActivity = null;
            }

            tag = null;
            bgTag = null;
        }
    }

    private void enableDisableForegroundDispatch(boolean enable) {
        Log.i(LOG_TAG, "enableForegroundDispatch, enable = " + enable);
        var context = getReactApplicationContext();
        NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(context);
        Activity currentActivity = context.getCurrentActivity();
        if (nfcAdapter != null && currentActivity != null && !currentActivity.isFinishing()) {
            try {
                if (isReaderModeEnabled) {
                    if (enable) {
                        Log.i(LOG_TAG, String.format("enableReaderMode, flags: %d, delay: %d ms", readerModeFlags, readerModeDelay));
                        Bundle readerModeExtras = new Bundle();
                        readerModeExtras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, readerModeDelay);
                        nfcAdapter.enableReaderMode(currentActivity, this::handleReaderModeTagDiscovered, readerModeFlags, readerModeExtras);
                    } else {
                        Log.i(LOG_TAG, "disableReaderMode");
                        nfcAdapter.disableReaderMode(currentActivity);
                    }
                } else {
                    if (enable) {
                        nfcAdapter.enableForegroundDispatch(currentActivity, getPendingIntent(), getIntentFilters(), getTechLists());
                    } else {
                        nfcAdapter.disableForegroundDispatch(currentActivity);
                    }
                }
            } catch (IllegalStateException | NullPointerException e) {
                Log.w(LOG_TAG, "Illegal State Exception starting NFC. Assuming application is terminating.");
            }
        }
    }

    private void handleReaderModeTagDiscovered(Tag tag) {
        synchronized (this) {
            this.tag = tag;
            Log.d(LOG_TAG, "readerMode onTagDiscovered");
            WritableMap nfcTag;
            if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                nfcTag = NdefHandler.ndefToReact(tag);
            } else {
                nfcTag = Util.tagToReact(tag);
            }

            if (nfcTag != null) {
                sendEvent("NfcManagerDiscoverTag", nfcTag);
                if (techRequest != null && !techRequest.isConnected()) {
                    boolean result = techRequest.connect(tag);
                    if (result) {
                        techRequest.invokePendingCallback(techRequest.getTechType());
                    } else {
                        techRequest.invokePendingCallback(null);
                    }
                }
            }
        }
    }

    private PendingIntent getPendingIntent() {
        Activity activity = getReactApplicationContext().getCurrentActivity();
        assert activity != null;
        Intent intent = new Intent(activity, activity.getClass());
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flag = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flag = PendingIntent.FLAG_MUTABLE;
        }
        return PendingIntent.getActivity(activity, 0, intent, flag);
    }

    private IntentFilter[] getIntentFilters() {
        return intentFilters.toArray(new IntentFilter[0]);
    }

    private String[][] getTechLists() {
        return techLists.toArray(new String[0][0]);
    }

    private void sendEvent(String eventName,
                           @Nullable WritableMap params) {
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            WritableMap eventPayload = params != null ? params : Arguments.createMap();
            switch (eventName) {
                case "NfcManagerDiscoverTag":
                    emitOnDiscoverTag(eventPayload);
                    return;
                case "NfcManagerDiscoverBackgroundTag":
                    emitOnDiscoverBackgroundTag(eventPayload);
                    return;
                case "NfcManagerStateChanged":
                    emitOnStateChanged(eventPayload);
                    return;
                default:
                    Log.w(LOG_TAG, "unknown NFC event: " + eventName);
                    return;
            }
        }
        getReactApplicationContext()
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    private void emitAdapterStateChanged(String stateStr) {
        try {
            WritableMap writableMap = Arguments.createMap();
            writableMap.putString("state", stateStr);
            sendEvent("NfcManagerStateChanged", writableMap);
        } catch (Exception ex) {
            Log.d(LOG_TAG, "send nfc state change event fail: " + ex);
        }
    }

    private WritableMap parseNfcIntent(Intent intent) {
        Log.d(LOG_TAG, "parseIntent " + intent);
        String action = intent.getAction();
        Log.d(LOG_TAG, "action " + action);
        if (action == null) {
            return null;
        }

        WritableMap parsed = null;
        Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
        if (tag == null) {
            return null;
        }
        // Parcelable[] messages = intent.getParcelableArrayExtra((NfcAdapter.EXTRA_NDEF_MESSAGES));

        synchronized(this) {
            this.tag = tag;
            if (writeNdefRequest != null) {
                NdefHandler.WriteNdefRequest request = writeNdefRequest;
                writeNdefRequest = null;
                NdefHandler.writeNdef(tag, request);

                // explicitly return null, to avoid extra detection
                return null;
            } else if (techRequest != null) {
                if (!techRequest.isConnected()) {
                    boolean result = techRequest.connect(tag);
                    if (result) {
                        techRequest.invokePendingCallback(techRequest.getTechType());
                    } else {
                        // this indicates that we get a NFC tag, but none of the user required tech is matched
                        techRequest.invokePendingCallback(null);
                    }
                }

                // explicitly return null, to avoid extra detection
                return null;
            }
        }

        switch (action) {
            case NfcAdapter.ACTION_NDEF_DISCOVERED:
                Parcelable[] messages = intent.getParcelableArrayExtra((NfcAdapter.EXTRA_NDEF_MESSAGES));
                parsed = NdefHandler.ndefToReact(tag, messages);
                break;
            case NfcAdapter.ACTION_TECH_DISCOVERED:
                // if the tag contains NDEF, we want to report the content
                if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                    parsed = NdefHandler.ndefToReact(tag);
                } else {
                    parsed = Util.tagToReact(tag);
                }
                break;
            case NfcAdapter.ACTION_TAG_DISCOVERED:
                parsed = Util.tagToReact(tag);
                break;
        }

        return parsed;
    }

}
