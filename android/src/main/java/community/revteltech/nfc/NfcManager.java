package community.revteltech.nfc;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
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
import android.nfc.FormatException;
import android.nfc.NdefMessage;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.TagLostException;
import android.nfc.tech.TagTechnology;
import android.nfc.tech.Ndef;
import android.nfc.tech.NfcA;
import android.nfc.tech.NfcB;
import android.nfc.tech.NfcF;
import android.nfc.tech.NfcV;
import android.nfc.tech.IsoDep;
import android.nfc.tech.NdefFormatable;
import android.nfc.tech.MifareClassic;
import android.nfc.tech.MifareUltralight;
import android.os.Parcelable;
import android.os.Bundle;

import org.json.JSONObject;
import org.json.JSONException;

import java.util.*;

class NfcManager extends ReactContextBaseJavaModule implements ActivityEventListener, LifecycleEventListener {
    private static final String LOG_TAG = "ReactNativeNfcManager";
    private final List<IntentFilter> intentFilters = new ArrayList<>();
    private final ArrayList<String[]> techLists = new ArrayList<>();
    private final Context context;
    private Boolean isForegroundEnabled = false;
    private Boolean isResumed = false;
    private WriteNdefRequest writeNdefRequest = null;
    private TagTechnologyRequest techRequest = null;
    private Tag tag = null;
    private WritableMap bgTag = null;
    // Use NFC reader mode instead of listening to a dispatch
    private Boolean isReaderModeEnabled = false;
    private int readerModeFlags = 0;
    private int readerModeDelay = 0;
    private static final String ERR_CANCEL = "cancelled";
    private static final String ERR_NOT_REGISTERED = "you should requestTagEvent first";
    private static final String ERR_MULTI_REQ = "You can only issue one request at a time";
    private static final String ERR_NO_TECH_REQ = "no tech request available";
    private static final String ERR_NO_REFERENCE = "no reference available";
    private static final String ERR_TRANSCEIVE_FAIL = "transceive fail";
    private static final String ERR_API_NOT_SUPPORT = "unsupported tag api";
    private static final String ERR_GET_ACTIVITY_FAIL = "fail to get current activity";
    private static final String ERR_NO_NFC_SUPPORT = "no nfc support";

    static class WriteNdefRequest {
        NdefMessage message;
        Callback callback;
        boolean format;
        boolean formatReadOnly;

        WriteNdefRequest(NdefMessage message, Callback callback, boolean format, boolean formatReadOnly) {
            this.message = message;
            this.callback = callback;
            this.format = format;
            this.formatReadOnly = formatReadOnly;
        }
    }

    public NfcManager(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
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

        constants.put("MIFARE_BLOCK_SIZE", MifareClassic.BLOCK_SIZE);
        constants.put("MIFARE_ULTRALIGHT_PAGE_SIZE", MifareUltralight.PAGE_SIZE);
        constants.put("MIFARE_ULTRALIGHT_TYPE", MifareUltralight.TYPE_ULTRALIGHT);
        constants.put("MIFARE_ULTRALIGHT_TYPE_C", MifareUltralight.TYPE_ULTRALIGHT_C);
        constants.put("MIFARE_ULTRALIGHT_TYPE_UNKNOWN", MifareUltralight.TYPE_UNKNOWN);

        return constants;
    }

    private boolean hasPendingRequest() {
        return writeNdefRequest != null || techRequest != null;
    }

    @ReactMethod
    public void cancelTechnologyRequest(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                techRequest.close();
                try {
                    techRequest.invokePendingCallbackWithError(ERR_CANCEL);
                } catch (RuntimeException ex) {
                    // the pending callback might already been invoked when there is an ongoing
                    // connected tag, bypass this case explicitly
                }
                techRequest = null;
            }
            callback.invoke();
        }
    }

    @ReactMethod
    public void requestTechnology(ReadableArray techs, Callback callback) {
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
            if (techRequest != null) {
                techRequest.close();
                techRequest = null;
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
                    WritableMap parsed = tag2React(tag);
                    if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                        try {
                            Ndef ndef = Ndef.get(tag);
                            parsed = ndef2React(ndef, new NdefMessage[]{ndef.getCachedNdefMessage()});
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
            if (techRequest != null) {
                try {
                    Ndef ndef = Ndef.get(techRequest.getTagHandle());
                    WritableMap parsed = ndef2React(ndef, new NdefMessage[] { ndef.getCachedNdefMessage() });
                    callback.invoke(null, parsed);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void getNdefMessage(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    Ndef ndef = Ndef.get(techRequest.getTagHandle());
                    WritableMap parsed = ndef2React(null, new NdefMessage[] { ndef.getNdefMessage() });
                    callback.invoke(null, parsed);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void getNdefStatus(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                WritableMap writableMap = Arguments.createMap();
                try {
                    Ndef ndef = Ndef.get(techRequest.getTagHandle());
                    int maxSize = ndef.getMaxSize();
                    boolean isWritable = ndef.isWritable();
                    boolean canMakeReadOnly = ndef.canMakeReadOnly();
                    writableMap.putInt("maxSize", maxSize);
                    writableMap.putBoolean("isWritable", isWritable);
                    writableMap.putBoolean("canMakeReadOnly", canMakeReadOnly);
                    callback.invoke(null, writableMap);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void writeNdefMessage(ReadableArray rnArray, ReadableMap options, Callback callback) {
        synchronized(this) {
            boolean reconnectAfterWrite = options.getBoolean("reconnectAfterWrite");
            
            if (techRequest != null) {
                try {
                    Ndef ndef = (Ndef)techRequest.getTechHandle();
                    if (ndef == null) {
                        callback.invoke(ERR_API_NOT_SUPPORT);
                    } else {
                        byte[] bytes = rnArrayToBytes(rnArray);
                        ndef.writeNdefMessage(new NdefMessage(bytes));
                        if (reconnectAfterWrite) {
                            ndef.close();
                            //reconnection is needed in order to be able to read the written ndef 
                            ndef.connect();
                        }
                        callback.invoke();
                    }
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void formatNdef(ReadableArray rnArray, ReadableMap options, Callback callback) {
        boolean readOnly = options.getBoolean("readOnly");

        synchronized(this) {
            if (techRequest != null) {
                try {
                    NdefFormatable ndef = (NdefFormatable)techRequest.getTechHandle();
                    if (ndef == null) {
                        callback.invoke(ERR_API_NOT_SUPPORT);
                    } else {
                        byte[] bytes = rnArrayToBytes(rnArray);
                        NdefMessage msg = new NdefMessage(bytes);
                        if (readOnly) {
                            ndef.formatReadOnly(msg);
                        } else {
                            ndef.format(msg);
                        }
                        callback.invoke();
                    }
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    private void mifareClassicAuthenticate(char type, int sector, ReadableArray key, Callback callback) {
        if (techRequest != null) {
            try {
                MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                    // Not a mifare card, fail
                    callback.invoke("mifareClassicAuthenticate fail: TYPE_UNKNOWN");
                    return;
                } else if (sector >= mifareTag.getSectorCount()) {
                    // Check if in range
                    @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicAuthenticate fail: invalid sector %d (max %d)", sector, mifareTag.getSectorCount());
                    callback.invoke(msg);
                    return;
                } else if (key.size() != 6) {
                    // Invalid key length
                    @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicAuthenticate fail: invalid key (needs length 6 but has %d characters)", key.size());
                    callback.invoke(msg);
                    return;
                }

                boolean result;
                if (type == 'A') {
                    result = mifareTag.authenticateSectorWithKeyA(sector, rnArrayToBytes(key));
                } else {
                    result = mifareTag.authenticateSectorWithKeyB(sector, rnArrayToBytes(key));
                }

                if (!result) {
                    callback.invoke("mifareClassicAuthenticate fail: AUTH_FAIL");
                    return;
                }

                callback.invoke(null, true);
            } catch (TagLostException ex) {
                callback.invoke("mifareClassicAuthenticate fail: TAG_LOST");
            } catch (Exception ex) {
                callback.invoke("mifareClassicAuthenticate fail: " + ex);
            }
        } else {
            callback.invoke(ERR_NO_TECH_REQ);
        }
    }

    @ReactMethod
    public void mifareClassicAuthenticateA(int sector, ReadableArray key, Callback callback) {
        synchronized(this) {
            mifareClassicAuthenticate('A', sector, key, callback);
        }
    }

    @ReactMethod
    public void mifareClassicAuthenticateB(int sector, ReadableArray key, Callback callback) {
        synchronized(this) {
            mifareClassicAuthenticate('B', sector, key, callback);
        }
    }

    @ReactMethod
    public void mifareClassicGetBlockCountInSector(int sectorIndex, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicGetBlockCountInSector fail: TYPE_UNKNOWN");
                        return;
                    } else if (sectorIndex >= mifareTag.getSectorCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicGetBlockCountInSector fail: invalid sector %d (max %d)", sectorIndex, mifareTag.getSectorCount());
                        callback.invoke(msg);
                        return;
                    }

                    callback.invoke(null, mifareTag.getBlockCountInSector(sectorIndex));
                } catch (Exception ex) {
                    callback.invoke("mifareClassicGetBlockCountInSector fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicGetSectorCount(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicGetSectorCount fail: TYPE_UNKNOWN");
                        return;
                    }

                    callback.invoke(null, mifareTag.getSectorCount());
                } catch (Exception ex) {
                    callback.invoke("mifareClassicGetSectorCount fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicSectorToBlock(int sectorIndex, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicSectorToBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (sectorIndex >= mifareTag.getSectorCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicSectorToBlock fail: invalid sector %d (max %d)", sectorIndex, mifareTag.getSectorCount());
                        callback.invoke(msg);
                        return;
                    }

                    callback.invoke(null, mifareTag.sectorToBlock(sectorIndex));
                } catch (Exception ex) {
                    callback.invoke("mifareClassicSectorToBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicReadBlock(int blockIndex, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicReadBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (blockIndex >= mifareTag.getBlockCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicReadBlock fail: invalid block %d (max %d)", blockIndex, mifareTag.getBlockCount());
                        callback.invoke(msg);
                        return;
                    }

                    byte[] buffer = mifareTag.readBlock(blockIndex);

                    WritableArray result = bytesToRnArray(buffer);
                    callback.invoke(null, result);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicReadBlock fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicReadBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicReadSector(int sectorIndex, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicReadSector fail: TYPE_UNKNOWN");
                        return;
                    } else if (sectorIndex >= mifareTag.getSectorCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicReadSector fail: invalid sector %d (max %d)", sectorIndex, mifareTag.getSectorCount());
                        callback.invoke(msg);
                        return;
                    }

                    WritableArray result = Arguments.createArray();
                    int blocks = mifareTag.getBlockCountInSector(sectorIndex);
                    byte[] buffer;
                    for (int i = 0; i < blocks; i++) {
                        buffer = mifareTag.readBlock(mifareTag.sectorToBlock(sectorIndex)+i);
                        appendBytesToRnArray(result, buffer);
                    }

                    callback.invoke(null, result);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicReadSector fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicReadSector fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicWriteBlock(int blockIndex, ReadableArray block, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicWriteBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (blockIndex >= mifareTag.getBlockCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicWriteBlock fail: invalid block %d (max %d)", blockIndex, mifareTag.getBlockCount());
                        callback.invoke(msg);
                        return;
                    } else if (block.size() != MifareClassic.BLOCK_SIZE) {
                        // Wrong block count
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicWriteBlock fail: invalid block size %d (should be %d)", block.size(), MifareClassic.BLOCK_SIZE);
                        callback.invoke(msg);
                        return;
                    }

                    byte[] buffer = rnArrayToBytes(block);
                    mifareTag.writeBlock(blockIndex, buffer);

                    callback.invoke(null, true);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicWriteBlock fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicWriteBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicIncrementBlock(int blockIndex, int value, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicIncrementBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (blockIndex >= mifareTag.getBlockCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicIncrementBlock fail: invalid block %d (max %d)", blockIndex, mifareTag.getBlockCount());
                        callback.invoke(msg);
                        return;
                    }

                    mifareTag.increment(blockIndex, value);

                    callback.invoke(null, true);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicIncrementBlock fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicIncrementBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicDecrementBlock(int blockIndex, int value, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicDecrementBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (blockIndex >= mifareTag.getBlockCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicDecrementBlock fail: invalid block %d (max %d)", blockIndex, mifareTag.getBlockCount());
                        callback.invoke(msg);
                        return;
                    }

                    mifareTag.decrement(blockIndex, value);

                    callback.invoke(null, true);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicDecrementBlock fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicDecrementBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareClassicTransferBlock(int blockIndex, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
                    if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                        // Not a mifare card, fail
                        callback.invoke("mifareClassicTransferBlock fail: TYPE_UNKNOWN");
                        return;
                    } else if (blockIndex >= mifareTag.getBlockCount()) {
                        // Check if in range
                        @SuppressLint("DefaultLocale") String msg = String.format("mifareClassicTransferBlock fail: invalid block %d (max %d)", blockIndex, mifareTag.getBlockCount());
                        callback.invoke(msg);
                        return;
                    }

                    mifareTag.transfer(blockIndex);

                    callback.invoke(null, true);
                } catch (TagLostException ex) {
                    callback.invoke("mifareClassicTransferBlock fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareClassicTransferBlock fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareUltralightReadPages(int pageOffset, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    MifareUltralight techHandle = (MifareUltralight)techRequest.getTechHandle();
                    byte[] resultBytes = techHandle.readPages(pageOffset);
                    WritableArray resultRnArray = bytesToRnArray(resultBytes);
                    callback.invoke(null, resultRnArray);
                } catch (TagLostException ex) {
                    callback.invoke("mifareUltralight fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareUltralight fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void mifareUltralightWritePage(int pageOffset, ReadableArray rnArray, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    byte[] bytes = rnArrayToBytes(rnArray);
                    MifareUltralight techHandle = (MifareUltralight)techRequest.getTechHandle();
                    techHandle.writePage(pageOffset, bytes);
                    callback.invoke();
                } catch (TagLostException ex) {
                    callback.invoke("mifareUltralight fail: TAG_LOST");
                } catch (Exception ex) {
                    callback.invoke("mifareUltralight fail: " + ex);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void makeReadOnly(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    Ndef ndef = (Ndef)techRequest.getTechHandle();
                    boolean result = ndef.makeReadOnly();
                    callback.invoke(null, result);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void setTimeout(int timeout, Callback callback) {
        synchronized (this) {
            if (techRequest != null) {
                try {
                    String tech = techRequest.getTechType();
                    TagTechnology baseTechHandle = techRequest.getTechHandle();
                    // TagTechnology is the base class for each tech (ex, NfcA, NfcB, IsoDep ...)
                    // but it doesn't provide transceive in its interface, so we need to explicitly cast it
                    switch (tech) {
                        case "NfcA": {
                            NfcA techHandle = (NfcA) baseTechHandle;
                            techHandle.setTimeout(timeout);
                            callback.invoke();
                            return;
                        }
                        case "NfcF": {
                            NfcF techHandle = (NfcF) baseTechHandle;
                            techHandle.setTimeout(timeout);
                            callback.invoke();
                            return;
                        }
                        case "IsoDep": {
                            IsoDep techHandle = (IsoDep) baseTechHandle;
                            techHandle.setTimeout(timeout);
                            callback.invoke();
                            return;
                        }
                        case "MifareClassic": {
                            MifareClassic techHandle = (MifareClassic) baseTechHandle;
                            techHandle.setTimeout(timeout);
                            callback.invoke();
                            return;
                        }
                        case "MifareUltralight": {
                            MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                            techHandle.setTimeout(timeout);
                            callback.invoke();
                            return;
                        }
                    }
                    Log.d(LOG_TAG, "setTimeout not supported");
                    callback.invoke(ERR_API_NOT_SUPPORT);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, ex.toString());
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void connect(ReadableArray techs, Callback callback){
        synchronized(this) {
            try {
                techRequest = new TagTechnologyRequest(techs.toArrayList(), callback);
                techRequest.connect(this.tag);
                callback.invoke(null, null);
            } catch (Exception ex) {
                callback.invoke(ex.toString());
            }
        }
    }

    @ReactMethod
    public void close(Callback callback){
        synchronized(this) {
            try {
                techRequest.close();
                callback.invoke(null, null);
            } catch (Exception ex) {
                callback.invoke(ex.toString());
            }
        }
    }

    @ReactMethod
    public void transceive(ReadableArray rnArray, Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    String tech = techRequest.getTechType();
                    byte[] bytes = rnArrayToBytes(rnArray);

                    TagTechnology baseTechHandle = techRequest.getTechHandle();
                    // TagTechnology is the base class for each tech (ex, NfcA, NfcB, IsoDep ...)
                    // but it doesn't provide transceive in its interface, so we need to explicitly cast it
                    switch (tech) {
                        case "NfcA": {
                            NfcA techHandle = (NfcA) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "NfcB": {
                            NfcB techHandle = (NfcB) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "NfcF": {
                            NfcF techHandle = (NfcF) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "NfcV": {
                            NfcV techHandle = (NfcV) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "IsoDep": {
                            IsoDep techHandle = (IsoDep) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "MifareClassic": {
                            MifareClassic techHandle = (MifareClassic) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                        case "MifareUltralight": {
                            MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                            byte[] resultBytes = techHandle.transceive(bytes);
                            WritableArray resultRnArray = bytesToRnArray(resultBytes);
                            callback.invoke(null, resultRnArray);
                            return;
                        }
                    }
                    Log.d(LOG_TAG, "transceive not supported");
                    callback.invoke(ERR_API_NOT_SUPPORT);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, "transceive fail: " + ex);
                    callback.invoke(ERR_TRANSCEIVE_FAIL);
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void getMaxTransceiveLength(Callback callback) {
        synchronized(this) {
            if (techRequest != null) {
                try {
                    String tech = techRequest.getTechType();

                    TagTechnology baseTechHandle = techRequest.getTechHandle();
                    // TagTechnology is the base class for each tech (ex, NfcA, NfcB, IsoDep ...)
                    // but it doesn't provide transceive in its interface, so we need to explicitly cast it
                    switch (tech) {
                        case "NfcA": {
                            NfcA techHandle = (NfcA) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                        case "NfcB": {
                            NfcB techHandle = (NfcB) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                        case "NfcF": {
                            NfcF techHandle = (NfcF) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                        case "NfcV": {
                            NfcV techHandle = (NfcV) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                        case "IsoDep": {
                            IsoDep techHandle = (IsoDep) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                        case "MifareUltralight": {
                            MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                            int max = techHandle.getMaxTransceiveLength();
                            callback.invoke(null, max);
                            return;
                        }
                    }
                    Log.d(LOG_TAG, "getMaxTransceiveLength not supported");
                    callback.invoke(ERR_API_NOT_SUPPORT);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, "getMaxTransceiveLength fail");
                    callback.invoke(ex.toString());
                }
            } else {
                callback.invoke(ERR_NO_TECH_REQ);
            }
        }
    }

    @ReactMethod
    public void cancelNdefWrite(Callback callback) {
        synchronized(this) {
            if (writeNdefRequest != null) {
                writeNdefRequest.callback.invoke(ERR_CANCEL);
                writeNdefRequest = null;
                callback.invoke();
            } else {
                callback.invoke(ERR_NOT_REGISTERED);
            }
        }
    }

    @ReactMethod
    public void requestNdefWrite(ReadableArray rnArray, ReadableMap options, Callback callback) {
        synchronized(this) {
            if (!isForegroundEnabled) {
                callback.invoke(ERR_NOT_REGISTERED);
                return;
            }

            if (hasPendingRequest()) {
                callback.invoke(ERR_MULTI_REQ);
            } else {
                boolean format = options.getBoolean("format");
                boolean formatReadOnly = options.getBoolean("formatReadOnly");

                try {
                    NdefMessage msgToWrite;

                    /// the only case we allow ndef message to be null is when formatting, see:
                    /// https://developer.android.com/reference/android/nfc/tech/NdefFormatable.html#format(android.nfc.NdefMessage)
                    ///	this API allows the `firstMessage` to be null
                    if (format && rnArray == null) {
                        msgToWrite = null;
                    } else {
                        byte[] bytes = rnArrayToBytes(rnArray);
                        msgToWrite = new NdefMessage(bytes);
                    }

                    writeNdefRequest = new WriteNdefRequest(
                            msgToWrite,
                            callback, // defer the callback
                            format,
                            formatReadOnly
                    );
                } catch (FormatException e) {
                    callback.invoke(e.toString());
                }
            }
        }
    }

    @ReactMethod
    public void start(Callback callback) {
        NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(context);
        if (nfcAdapter != null) {
            Log.d(LOG_TAG, "start");

            IntentFilter filter = new IntentFilter(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED);
            Activity currentActivity = getCurrentActivity();
            if (currentActivity == null) {
                callback.invoke(ERR_GET_ACTIVITY_FAIL);
                return;
            }

            currentActivity.registerReceiver(mReceiver, filter);
            Intent launchIntent = currentActivity.getIntent();
            // we consider the launching intent to be background
            bgTag = parseNfcIntent(launchIntent);
            callback.invoke();
        } else {
            Log.d(LOG_TAG, "not support in this device");
            callback.invoke(ERR_NO_NFC_SUPPORT);
        }
    }

    @ReactMethod
    public void isSupported(String tech, Callback callback){
        Log.d(LOG_TAG, "isSupported");
        Activity currentActivity = getCurrentActivity();
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
            if (!MifareUtil.isDeviceSupported(currentActivity)) {
                callback.invoke(null, false);
                return;
            }
        }

        callback.invoke(null, true);
    }

    @ReactMethod
    public void isEnabled(Callback callback) {
        Log.d(LOG_TAG, "isEnabled");
        NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(context);
        if (nfcAdapter != null) {
            callback.invoke(null, nfcAdapter.isEnabled());
        } else {
            callback.invoke(null, false);
        }
    }

    @ReactMethod
    public void goToNfcSetting(Callback callback) {
        Log.d(LOG_TAG, "goToNfcSetting");
        Activity currentActivity = getCurrentActivity();
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
        Activity currentActivity = getCurrentActivity();
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
    private void registerTagEvent(ReadableMap options, Callback callback) {
        isReaderModeEnabled = options.getBoolean("isReaderModeEnabled");
        readerModeFlags = options.getInt("readerModeFlags");
        readerModeDelay = options.getInt("readerModeDelay");

        Log.d(LOG_TAG, "registerTagEvent");
        isForegroundEnabled = true;

        // capture all mime-based dispatch NDEF
        IntentFilter ndef = new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED);
        try {
            ndef.addDataType("*/*");
        } catch (MalformedMimeTypeException e) {
            throw new RuntimeException("fail", e);
        }
        intentFilters.add(ndef);

        // capture all rest NDEF, such as uri-based
        intentFilters.add(new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED));
        techLists.add(new String[]{Ndef.class.getName()});

        // for those without NDEF, get them as tags
        intentFilters.add(new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED));

        if (isResumed) {
            enableDisableForegroundDispatch(true);
        }
        callback.invoke();
    }

    @ReactMethod
    private void unregisterTagEvent(Callback callback) {
        Log.d(LOG_TAG, "unregisterTagEvent");
        if (isResumed) {
            enableDisableForegroundDispatch(false);
        }

        intentFilters.clear();
        isForegroundEnabled = false;
        isReaderModeEnabled = false;
        readerModeFlags = 0;
        readerModeDelay = 0;

        callback.invoke();
    }

    @ReactMethod
    private void hasTagEventRegistration(Callback callback) {
        Log.d(LOG_TAG, "isSessionAvailable: " + isForegroundEnabled);
        callback.invoke(null, isForegroundEnabled);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
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
    }

    private void enableDisableForegroundDispatch(boolean enable) {
        Log.i(LOG_TAG, "enableForegroundDispatch, enable = " + enable);
        NfcAdapter nfcAdapter = NfcAdapter.getDefaultAdapter(context);
        Activity currentActivity = getCurrentActivity();
        final NfcManager manager = this;
        if (nfcAdapter != null && currentActivity != null && !currentActivity.isFinishing()) {
            try {
                if (isReaderModeEnabled) {
                    if (enable) {
                        Log.i(LOG_TAG, "enableReaderMode: " + readerModeFlags);
                        Bundle readerModeExtras = new Bundle();
                        readerModeExtras.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, readerModeDelay * 1000);
                        nfcAdapter.enableReaderMode(currentActivity, new NfcAdapter.ReaderCallback() {
                            @Override
                            public void onTagDiscovered(Tag tag) {
                                synchronized (this) {
                                    manager.tag = tag;
                                    Log.d(LOG_TAG, "readerMode onTagDiscovered");
                                    WritableMap nfcTag;
                                    // if the tag contains NDEF, we want to report the content
                                    if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                                        Ndef ndef = Ndef.get(tag);
                                        nfcTag = ndef2React(ndef, new NdefMessage[] { ndef.getCachedNdefMessage() });
                                    } else {
                                        nfcTag = tag2React(tag);
                                    }

                                    if (nfcTag != null) {
                                        sendEvent("NfcManagerDiscoverTag", nfcTag);
                                        if (techRequest!= null && !techRequest.isConnected()) {
                                            boolean result = techRequest.connect(tag);
                                            if (result) {
                                                techRequest.invokePendingCallback(techRequest.getTechType());
                                            } else {
                                                // this indicates that we get a NFC tag, but none of the user required tech is matched
                                                techRequest.invokePendingCallback(null);
                                            }
                                        }
                                    }
                                }
                            }
                        }, readerModeFlags, readerModeExtras);
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

    private PendingIntent getPendingIntent() {
        Activity activity = getCurrentActivity();
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
        getReactApplicationContext()
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(LOG_TAG, "onReceive " + intent);
            final String action = intent.getAction();

            if (action.equals(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED)) {
                final int state = intent.getIntExtra(NfcAdapter.EXTRA_ADAPTER_STATE,
                        NfcAdapter.STATE_OFF);
                String stateStr = "unknown";
                switch (state) {
                    case NfcAdapter.STATE_OFF:
                        stateStr = "off";
                        break;
                    case NfcAdapter.STATE_TURNING_OFF:
                        stateStr = "turning_off";
                        break;
                    case NfcAdapter.STATE_ON:
                        stateStr = "on";
                        break;
                    case NfcAdapter.STATE_TURNING_ON:
                        stateStr = "turning_on";
                        break;
                }

                try {
                    WritableMap writableMap = Arguments.createMap();
                    writableMap.putString("state", stateStr);
                    sendEvent("NfcManagerStateChanged", writableMap);
                } catch (Exception ex) {
                    Log.d(LOG_TAG, "send nfc state change event fail: " + ex);
                }
            }
        }
    };

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
                writeNdef(
                        tag,
                        writeNdefRequest
                );
                writeNdefRequest = null;

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

        Ndef ndef;
        switch (action) {
            case NfcAdapter.ACTION_NDEF_DISCOVERED:
                ndef = Ndef.get(tag);
                Parcelable[] messages = intent.getParcelableArrayExtra((NfcAdapter.EXTRA_NDEF_MESSAGES));
                parsed = ndef2React(ndef, messages);
                break;
            case NfcAdapter.ACTION_TECH_DISCOVERED:
                // if the tag contains NDEF, we want to report the content
                if (Arrays.asList(tag.getTechList()).contains(Ndef.class.getName())) {
                    ndef = Ndef.get(tag);
                    parsed = ndef2React(ndef, new NdefMessage[]{ndef.getCachedNdefMessage()});
                } else {
                    parsed = tag2React(tag);
                }
                break;
            case NfcAdapter.ACTION_TAG_DISCOVERED:
                parsed = tag2React(tag);
                break;
        }

        return parsed;
    }

    private WritableMap tag2React(Tag tag) {
        try {
            JSONObject json = Util.tagToJSON(tag);
            return JsonConvert.jsonToReact(json);
        } catch (JSONException ex) {
            return null;
        }
    }

    private WritableMap ndef2React(Ndef ndef, Parcelable[] messages) {
        try {
            JSONObject json = buildNdefJSON(ndef, messages);
            return JsonConvert.jsonToReact(json);
        } catch (JSONException ex) {
            return null;
        }
    }

    JSONObject buildNdefJSON(Ndef ndef, Parcelable[] messages) {
        JSONObject json = Util.ndefToJSON(ndef);

        // ndef is null for peer-to-peer
        // ndef and messages are null for ndef format-able
        if (ndef == null && messages != null) {
            try {

                if (messages.length > 0) {
                    NdefMessage message = (NdefMessage) messages[0];
                    json.put("ndefMessage", Util.messageToJSON(message));
                    // guessing type, would prefer a more definitive way to determine type
                    json.put("type", "NDEF");
                }

                if (messages.length > 1) {
                    Log.d(LOG_TAG, "Expected one ndefMessage but found " + messages.length);
                }

            } catch (JSONException e) {
                // shouldn't happen
                Log.e(Util.TAG, "Failed to convert ndefMessage into json", e);
            }
        }
        return json;
    }

    private void writeNdef(Tag tag, WriteNdefRequest request) {
        NdefMessage message = request.message;
        Callback callback = request.callback;
        boolean formatReadOnly = request.formatReadOnly;
        boolean format = request.format;

        if (format || formatReadOnly) {
            try {
                Log.d(LOG_TAG, "ready to writeNdef");
                NdefFormatable formatable = NdefFormatable.get(tag);
                if (formatable == null) {
                    callback.invoke(ERR_API_NOT_SUPPORT);
                } else {
                    Log.d(LOG_TAG, "ready to format ndef, seriously");
                    formatable.connect();
                    if (formatReadOnly) {
                        formatable.formatReadOnly(message);
                    } else {
                        formatable.format(message);
                    }
                    callback.invoke();
                }
            } catch (Exception ex) {
                callback.invoke(ex.toString());
            }
        } else {
            try {
                Log.d(LOG_TAG, "ready to writeNdef");
                Ndef ndef = Ndef.get(tag);
                if (ndef == null) {
                    callback.invoke(ERR_API_NOT_SUPPORT);
                } else if (!ndef.isWritable()) {
                    callback.invoke("tag is not writeable");
                } else if (ndef.getMaxSize() < message.toByteArray().length) {
                    callback.invoke("tag size is not enough");
                } else {
                    Log.d(LOG_TAG, "ready to writeNdef, seriously");
                    ndef.connect();
                    ndef.writeNdefMessage(message);
                    callback.invoke();
                }
            } catch (Exception ex) {
                callback.invoke(ex.toString());
            }
        }
    }

    private static byte[] rnArrayToBytes(ReadableArray rArray) {
        byte[] bytes = new byte[rArray.size()];
        for (int i = 0; i < rArray.size(); i++) {
            bytes[i] = (byte)(rArray.getInt(i) & 0xff);
        }
        return bytes;
    }

    private static WritableArray bytesToRnArray(byte[] bytes) {
        return appendBytesToRnArray(Arguments.createArray(), bytes);
    }

    private static WritableArray appendBytesToRnArray(WritableArray value, byte[] bytes) {
        for (byte aByte : bytes) {
            value.pushInt((aByte & 0xFF));
        }
        return value;
    }
}

