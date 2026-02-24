package community.revteltech.nfc;

import static community.revteltech.nfc.NfcErrorCodes.*;

import android.nfc.tech.IsoDep;
import android.nfc.tech.MifareClassic;
import android.nfc.tech.MifareUltralight;
import android.nfc.tech.NfcA;
import android.nfc.tech.NfcB;
import android.nfc.tech.NfcF;
import android.nfc.tech.NfcV;
import android.nfc.tech.TagTechnology;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;

class NfcTechIoRouter {
    private static final String LOG_TAG = "ReactNativeNfcManager";

    private NfcTechIoRouter() {
    }

    static void setTimeout(
            TagTechnologyRequest techRequest,
            int timeout,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            String tech = techRequest.getTechType();
            TagTechnology baseTechHandle = techRequest.getTechHandle();
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
    }

    static void getTimeout(
            TagTechnologyRequest techRequest,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            String tech = techRequest.getTechType();
            TagTechnology baseTechHandle = techRequest.getTechHandle();
            switch (tech) {
                case "NfcA": {
                    NfcA techHandle = (NfcA) baseTechHandle;
                    callback.invoke(null, techHandle.getTimeout());
                    return;
                }
                case "NfcF": {
                    NfcF techHandle = (NfcF) baseTechHandle;
                    callback.invoke(null, techHandle.getTimeout());
                    return;
                }
                case "IsoDep": {
                    IsoDep techHandle = (IsoDep) baseTechHandle;
                    callback.invoke(null, techHandle.getTimeout());
                    return;
                }
                case "MifareClassic": {
                    MifareClassic techHandle = (MifareClassic) baseTechHandle;
                    callback.invoke(null, techHandle.getTimeout());
                    return;
                }
                case "MifareUltralight": {
                    MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                    callback.invoke(null, techHandle.getTimeout());
                    return;
                }
            }

            Log.d(LOG_TAG, "getTimeout not supported");
            callback.invoke(ERR_API_NOT_SUPPORT);
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void transceive(
            TagTechnologyRequest techRequest,
            ReadableArray rnArray,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            String tech = techRequest.getTechType();
            byte[] bytes = rnArrayToBytes(rnArray);
            TagTechnology baseTechHandle = techRequest.getTechHandle();

            switch (tech) {
                case "NfcA": {
                    NfcA techHandle = (NfcA) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "NfcB": {
                    NfcB techHandle = (NfcB) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "NfcF": {
                    NfcF techHandle = (NfcF) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "NfcV": {
                    NfcV techHandle = (NfcV) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "IsoDep": {
                    IsoDep techHandle = (IsoDep) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "MifareClassic": {
                    MifareClassic techHandle = (MifareClassic) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
                case "MifareUltralight": {
                    MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                    callback.invoke(null, bytesToRnArray(techHandle.transceive(bytes)));
                    return;
                }
            }

            Log.d(LOG_TAG, "transceive not supported");
            callback.invoke(ERR_API_NOT_SUPPORT);
        } catch (Exception ex) {
            Log.d(LOG_TAG, "transceive fail: " + ex);
            callback.invoke(ERR_TRANSCEIVE_FAIL);
        }
    }

    static void getMaxTransceiveLength(
            TagTechnologyRequest techRequest,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            String tech = techRequest.getTechType();
            TagTechnology baseTechHandle = techRequest.getTechHandle();
            switch (tech) {
                case "NfcA": {
                    NfcA techHandle = (NfcA) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
                case "NfcB": {
                    NfcB techHandle = (NfcB) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
                case "NfcF": {
                    NfcF techHandle = (NfcF) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
                case "NfcV": {
                    NfcV techHandle = (NfcV) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
                case "IsoDep": {
                    IsoDep techHandle = (IsoDep) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
                case "MifareUltralight": {
                    MifareUltralight techHandle = (MifareUltralight) baseTechHandle;
                    callback.invoke(null, techHandle.getMaxTransceiveLength());
                    return;
                }
            }

            Log.d(LOG_TAG, "getMaxTransceiveLength not supported");
            callback.invoke(ERR_API_NOT_SUPPORT);
        } catch (Exception ex) {
            Log.d(LOG_TAG, "getMaxTransceiveLength fail");
            callback.invoke(ex.toString());
        }
    }

    private static byte[] rnArrayToBytes(ReadableArray rArray) {
        byte[] bytes = new byte[rArray.size()];
        for (int i = 0; i < rArray.size(); i++) {
            bytes[i] = (byte) (rArray.getInt(i) & 0xff);
        }
        return bytes;
    }

    private static WritableArray bytesToRnArray(byte[] bytes) {
        WritableArray value = Arguments.createArray();
        for (byte aByte : bytes) {
            value.pushInt((aByte & 0xFF));
        }
        return value;
    }
}