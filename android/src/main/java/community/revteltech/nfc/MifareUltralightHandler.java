package community.revteltech.nfc;

import static community.revteltech.nfc.NfcErrorCodes.*;

import android.nfc.TagLostException;
import android.nfc.tech.MifareUltralight;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;

class MifareUltralightHandler {
    private MifareUltralightHandler() {
    }

    static void putConstants(java.util.Map<String, Object> constants) {
        constants.put("MIFARE_ULTRALIGHT_PAGE_SIZE", MifareUltralight.PAGE_SIZE);
        constants.put("MIFARE_ULTRALIGHT_TYPE", MifareUltralight.TYPE_ULTRALIGHT);
        constants.put("MIFARE_ULTRALIGHT_TYPE_C", MifareUltralight.TYPE_ULTRALIGHT_C);
        constants.put("MIFARE_ULTRALIGHT_TYPE_UNKNOWN", MifareUltralight.TYPE_UNKNOWN);
    }

    static void readPages(
            TagTechnologyRequest techRequest,
            int pageOffset,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareUltralight techHandle = (MifareUltralight) techRequest.getTechHandle();
            byte[] resultBytes = techHandle.readPages(pageOffset);
            WritableArray resultRnArray = bytesToRnArray(resultBytes);
            callback.invoke(null, resultRnArray);
        } catch (TagLostException ex) {
            callback.invoke("mifareUltralight fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareUltralight fail: " + ex);
        }
    }

    static void writePage(
            TagTechnologyRequest techRequest,
            int pageOffset,
            ReadableArray rnArray,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            byte[] bytes = rnArrayToBytes(rnArray);
            MifareUltralight techHandle = (MifareUltralight) techRequest.getTechHandle();
            techHandle.writePage(pageOffset, bytes);
            callback.invoke();
        } catch (TagLostException ex) {
            callback.invoke("mifareUltralight fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareUltralight fail: " + ex);
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
