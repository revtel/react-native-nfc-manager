package community.revteltech.nfc;

import static community.revteltech.nfc.NfcErrorCodes.*;

import android.nfc.FormatException;
import android.nfc.NdefMessage;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.nfc.tech.NdefFormatable;
import android.os.Parcelable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONException;
import org.json.JSONObject;

class NdefHandler {
    private static final String LOG_TAG = "ReactNativeNfcManager";

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

        void invokeCallback() {
            Callback pendingCallback = takeCallback();
            if (pendingCallback != null) {
                pendingCallback.invoke();
            }
        }

        void invokeCallbackWithError(String error) {
            Callback pendingCallback = takeCallback();
            if (pendingCallback != null) {
                pendingCallback.invoke(error);
            }
        }

        private Callback takeCallback() {
            Callback pendingCallback = callback;
            callback = null;
            return pendingCallback;
        }
    }

    private NdefHandler() {
    }

    static void getCachedNdefMessage(TagTechnologyRequest techRequest, Callback callback) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            WritableMap parsed = ndefToReact(techRequest.getTagHandle());
            callback.invoke(null, parsed);
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void getNdefMessage(TagTechnologyRequest techRequest, Callback callback) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            Ndef ndef = Ndef.get(techRequest.getTagHandle());
            WritableMap parsed = ndefToReact(techRequest.getTagHandle(), new NdefMessage[] { ndef.getNdefMessage() });
            callback.invoke(null, parsed);
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void queryNdefStatus(TagTechnologyRequest techRequest, Callback callback) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        WritableMap writableMap = Arguments.createMap();
        try {
            Ndef ndef = Ndef.get(techRequest.getTagHandle());
            writableMap.putInt("maxSize", ndef.getMaxSize());
            writableMap.putBoolean("isWritable", ndef.isWritable());
            writableMap.putBoolean("canMakeReadOnly", ndef.canMakeReadOnly());
            callback.invoke(null, writableMap);
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void writeNdefMessage(
            TagTechnologyRequest techRequest,
            ReadableArray rnArray,
            ReadableMap options,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        boolean reconnectAfterWrite = options.getBoolean("reconnectAfterWrite");
        try {
            Ndef ndef = (Ndef) techRequest.getTechHandle();
            if (ndef == null) {
                callback.invoke(ERR_API_NOT_SUPPORT);
                return;
            }

            byte[] bytes = rnArrayToBytes(rnArray);
            ndef.writeNdefMessage(new NdefMessage(bytes));
            if (reconnectAfterWrite) {
                ndef.close();
                ndef.connect();
            }
            callback.invoke();
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void formatNdef(
            TagTechnologyRequest techRequest,
            ReadableArray rnArray,
            ReadableMap options,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        boolean readOnly = options.getBoolean("readOnly");
        try {
            NdefFormatable ndef = (NdefFormatable) techRequest.getTechHandle();
            if (ndef == null) {
                callback.invoke(ERR_API_NOT_SUPPORT);
                return;
            }

            byte[] bytes = rnArrayToBytes(rnArray);
            NdefMessage msg = new NdefMessage(bytes);
            if (readOnly) {
                ndef.formatReadOnly(msg);
            } else {
                ndef.format(msg);
            }
            callback.invoke();
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

    static void makeReadOnly(
            TagTechnologyRequest techRequest,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            Ndef ndef = (Ndef) techRequest.getTechHandle();
            boolean result = ndef.makeReadOnly();
            callback.invoke(null, result);
        } catch (Exception ex) {
            Log.d(LOG_TAG, ex.toString());
            callback.invoke(ex.toString());
        }
    }

        static WriteNdefRequest cancelNdefWrite(
            WriteNdefRequest writeNdefRequest,
            Callback callback
    ) {
        if (writeNdefRequest != null) {
            writeNdefRequest.invokeCallbackWithError(ERR_CANCEL);
            callback.invoke();
            return null;
        }

        callback.invoke(ERR_NOT_REGISTERED);
        return writeNdefRequest;
    }

        static WriteNdefRequest requestNdefWrite(
            ReadableArray rnArray,
            ReadableMap options,
            boolean isForegroundEnabled,
            boolean hasPendingRequest,
            WriteNdefRequest writeNdefRequest,
            Callback callback
    ) {
        if (!isForegroundEnabled) {
            callback.invoke(ERR_NOT_REGISTERED);
            return writeNdefRequest;
        }

        if (hasPendingRequest) {
            callback.invoke(ERR_MULTI_REQ);
            return writeNdefRequest;
        }

        boolean format = options.getBoolean("format");
        boolean formatReadOnly = options.getBoolean("formatReadOnly");

        try {
            NdefMessage msgToWrite;
            if (format && rnArray == null) {
                msgToWrite = null;
            } else {
                byte[] bytes = rnArrayToBytes(rnArray);
                msgToWrite = new NdefMessage(bytes);
            }

                return new WriteNdefRequest(
                    msgToWrite,
                    callback,
                    format,
                    formatReadOnly
            );
        } catch (FormatException e) {
            callback.invoke(e.toString());
            return writeNdefRequest;
        }
    }

    static void writeNdef(
            Tag tag,
            WriteNdefRequest request
    ) {
        NdefMessage message = request.message;
        boolean formatReadOnly = request.formatReadOnly;
        boolean format = request.format;

        if (format || formatReadOnly) {
            NdefFormatable formatable = null;
            try {
                Log.d(LOG_TAG, "ready to writeNdef");
                formatable = NdefFormatable.get(tag);
                if (formatable == null) {
                    request.invokeCallbackWithError(ERR_API_NOT_SUPPORT);
                } else {
                    Log.d(LOG_TAG, "ready to format ndef, seriously");
                    formatable.connect();
                    if (formatReadOnly) {
                        formatable.formatReadOnly(message);
                    } else {
                        formatable.format(message);
                    }
                    request.invokeCallback();
                }
            } catch (Exception ex) {
                request.invokeCallbackWithError(ex.toString());
            } finally {
                closeQuietly(formatable);
            }
        } else {
            Ndef ndef = null;
            try {
                Log.d(LOG_TAG, "ready to writeNdef");
                ndef = Ndef.get(tag);
                if (ndef == null) {
                    request.invokeCallbackWithError(ERR_API_NOT_SUPPORT);
                } else if (!ndef.isWritable()) {
                    request.invokeCallbackWithError("tag is not writeable");
                } else if (ndef.getMaxSize() < message.toByteArray().length) {
                    request.invokeCallbackWithError("tag size is not enough");
                } else {
                    Log.d(LOG_TAG, "ready to writeNdef, seriously");
                    ndef.connect();
                    ndef.writeNdefMessage(message);
                    request.invokeCallback();
                }
            } catch (Exception ex) {
                request.invokeCallbackWithError(ex.toString());
            } finally {
                closeQuietly(ndef);
            }
        }
    }

    private static void closeQuietly(android.nfc.tech.TagTechnology technology) {
        if (technology == null) {
            return;
        }

        try {
            technology.close();
        } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to close NDEF technology: " + ex);
        }
    }

    static WritableMap ndefToReact(Tag tag, Parcelable[] messages) {
        try {
            Ndef ndef = tag != null ? Ndef.get(tag) : null;
            JSONObject json = buildNdefJSON(ndef, messages);
            return Util.jsonToReact(json);
        } catch (JSONException ex) {
            return null;
        }
    }

    static WritableMap ndefToReact(Tag tag) {
        Ndef ndef = tag != null ? Ndef.get(tag) : null;
        Parcelable[] messages = null;
        if (ndef != null) {
            messages = new NdefMessage[] { ndef.getCachedNdefMessage() };
        }

        try {
            JSONObject json = buildNdefJSON(ndef, messages);
            return Util.jsonToReact(json);
        } catch (JSONException ex) {
            return null;
        }
    }

    private static JSONObject buildNdefJSON(Ndef ndef, Parcelable[] messages) {
        JSONObject json = Util.ndefToJSON(ndef);

        if (ndef == null && messages != null) {
            try {
                if (messages.length > 0) {
                    NdefMessage message = (NdefMessage) messages[0];
                    json.put("ndefMessage", Util.messageToJSON(message));
                    json.put("type", "NDEF");
                }

                if (messages.length > 1) {
                    Log.d(LOG_TAG, "Expected one ndefMessage but found " + messages.length);
                }
            } catch (JSONException e) {
                Log.e(Util.TAG, "Failed to convert ndefMessage into json", e);
            }
        }

        return json;
    }

    private static byte[] rnArrayToBytes(ReadableArray rArray) {
        byte[] bytes = new byte[rArray.size()];
        for (int i = 0; i < rArray.size(); i++) {
            bytes[i] = (byte) (rArray.getInt(i) & 0xff);
        }
        return bytes;
    }
}
