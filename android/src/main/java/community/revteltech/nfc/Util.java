package community.revteltech.nfc;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class Util {

    static final String TAG = "NfcPlugin";
    final protected static char[] hexArray = "0123456789ABCDEF".toCharArray();

    // region React-JSON Conversion

    static JSONObject reactToJSON(ReadableMap readableMap) throws JSONException {
        JSONObject jsonObject = new JSONObject();
        ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        while(iterator.hasNextKey()){
            String key = iterator.nextKey();
            ReadableType valueType = readableMap.getType(key);
            switch (valueType){
                case Null:
                    jsonObject.put(key,JSONObject.NULL);
                    break;
                case Boolean:
                    jsonObject.put(key, readableMap.getBoolean(key));
                    break;
                case Number:
                    try {
                        jsonObject.put(key, readableMap.getInt(key));
                    } catch(Exception e) {
                        jsonObject.put(key, readableMap.getDouble(key));
                    }
                    break;
                case String:
                    jsonObject.put(key, readableMap.getString(key));
                    break;
                case Map:
                    jsonObject.put(key, reactToJSON(readableMap.getMap(key)));
                    break;
                case Array:
                    jsonObject.put(key, reactToJSON(readableMap.getArray(key)));
                    break;
            }
        }

        return jsonObject;
    }

    static JSONArray reactToJSON(ReadableArray readableArray) throws JSONException {
        JSONArray jsonArray = new JSONArray();
        for(int i=0; i < readableArray.size(); i++) {
            ReadableType valueType = readableArray.getType(i);
            switch (valueType){
                case Null:
                    jsonArray.put(JSONObject.NULL);
                    break;
                case Boolean:
                    jsonArray.put(readableArray.getBoolean(i));
                    break;
                case Number:
                    try {
                        jsonArray.put(readableArray.getInt(i));
                    } catch(Exception e) {
                        jsonArray.put(readableArray.getDouble(i));
                    }
                    break;
                case String:
                    jsonArray.put(readableArray.getString(i));
                    break;
                case Map:
                    jsonArray.put(reactToJSON(readableArray.getMap(i)));
                    break;
                case Array:
                    jsonArray.put(reactToJSON(readableArray.getArray(i)));
                    break;
            }
        }
        return jsonArray;
    }

    static WritableMap jsonToReact(JSONObject jsonObject) throws JSONException {
        WritableMap writableMap = Arguments.createMap();
        Iterator<String> iterator = jsonObject.keys();
        while(iterator.hasNext()) {
            String key = iterator.next();
            Object value = jsonObject.get(key);
            if (value instanceof Float || value instanceof Double) {
                writableMap.putDouble(key, jsonObject.getDouble(key));
            } else if (value instanceof Number) {
                writableMap.putInt(key, jsonObject.getInt(key));
            } else if (value instanceof String) {
                writableMap.putString(key, jsonObject.getString(key));
            } else if (value instanceof JSONObject) {
                writableMap.putMap(key,jsonToReact(jsonObject.getJSONObject(key)));
            } else if (value instanceof JSONArray){
                writableMap.putArray(key, jsonToReact(jsonObject.getJSONArray(key)));
            } else if ("true".equals(value.toString()) || "false".equals(value.toString())){
                writableMap.putBoolean(key, "true".equals(value.toString()));
            } else if (value == JSONObject.NULL){
                writableMap.putNull(key);
            }
        }

        return writableMap;
    }

    static WritableArray jsonToReact(JSONArray jsonArray) throws JSONException {
        WritableArray writableArray = Arguments.createArray();
        for(int i=0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);
            if (value instanceof Float || value instanceof Double) {
                writableArray.pushDouble(jsonArray.getDouble(i));
            } else if (value instanceof Number) {
                writableArray.pushInt(jsonArray.getInt(i));
            } else if (value instanceof String) {
                writableArray.pushString(jsonArray.getString(i));
            } else if (value instanceof JSONObject) {
                writableArray.pushMap(jsonToReact(jsonArray.getJSONObject(i)));
            } else if (value instanceof JSONArray){
                writableArray.pushArray(jsonToReact(jsonArray.getJSONArray(i)));
            } else if ("true".equals(value.toString()) || "false".equals(value.toString())){
                writableArray.pushBoolean("true".equals(value.toString()));
            } else if (value == JSONObject.NULL){
                writableArray.pushNull();
            }
        }
        return writableArray;
    }

    // endregion

    // region NFC Conversion

    static JSONObject ndefToJSON(Ndef ndef) {
        JSONObject json = new JSONObject();

        if (ndef != null) {
            try {

                Tag tag = ndef.getTag();
                // tag is going to be null for NDEF_FORMATABLE until NfcUtil.parseMessage is refactored
                if (tag != null) {
                    json.put("id", bytesToHex(tag.getId()));
                    json.put("techTypes", new JSONArray(Arrays.asList(tag.getTechList())));
                }

                json.put("type", translateType(ndef.getType()));
                json.put("maxSize", ndef.getMaxSize());
                json.put("isWritable", ndef.isWritable());
                json.put("ndefMessage", messageToJSON(ndef.getCachedNdefMessage()));
                // Workaround for bug in ICS (Android 4.0 and 4.0.1) where
                // mTag.getTagService(); of the Ndef object sometimes returns null
                // see http://issues.mroland.at/index.php?do=details&task_id=47
                try {
                    json.put("canMakeReadOnly", ndef.canMakeReadOnly());
                } catch (NullPointerException e) {
                    json.put("canMakeReadOnly", JSONObject.NULL);
                } catch (SecurityException e) {
                    Log.e(TAG, "Failed due to out of date tag", e);
                    json.put("canMakeReadOnly", JSONObject.NULL);
                }   
            } catch (JSONException e) {
                Log.e(TAG, "Failed to convert ndef into json: " + ndef, e);
            }
        }
        return json;
    }

    static JSONObject tagToJSON(Tag tag) {
        JSONObject json = new JSONObject();

        if (tag != null) {
            try {
                json.put("id", bytesToHex(tag.getId()));
                json.put("techTypes", new JSONArray(Arrays.asList(tag.getTechList())));
            } catch (JSONException e) {
                Log.e(TAG, "Failed to convert tag into json: " + tag, e);
            }
        }
        return json;
    }

    static WritableMap tagToReact(Tag tag) {
        try {
            JSONObject json = tagToJSON(tag);
            return jsonToReact(json);
        } catch (JSONException ex) {
            return null;
        }
    }

    static String translateType(String type) {
        String translation;
        switch (type) {
            case Ndef.NFC_FORUM_TYPE_1:
                translation = "NFC Forum Type 1";
                break;
            case Ndef.NFC_FORUM_TYPE_2:
                translation = "NFC Forum Type 2";
                break;
            case Ndef.NFC_FORUM_TYPE_3:
                translation = "NFC Forum Type 3";
                break;
            case Ndef.NFC_FORUM_TYPE_4:
                translation = "NFC Forum Type 4";
                break;
            default:
                translation = type;
                break;
        }
        return translation;
    }

    static JSONArray byteArrayToJSON(byte[] bytes) {
        JSONArray json = new JSONArray();
        for (byte aByte : bytes) {
            int v = aByte & 0xFF;
            json.put(v);
        }
        return json;
    }

    public static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];

        for ( int j = 0; j < bytes.length; j++ ) {
            int v = bytes[j] & 0xFF;

            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }

        return new String(hexChars);
    }

    static JSONArray messageToJSON(NdefMessage message) {
        if (message == null) {
            return null;
        }

        List<JSONObject> list = new ArrayList<>();

        for (NdefRecord ndefRecord : message.getRecords()) {
            list.add(recordToJSON(ndefRecord));
        }

        return new JSONArray(list);
    }

    static JSONObject recordToJSON(NdefRecord record) {
        JSONObject json = new JSONObject();
        try {
            json.put("tnf", record.getTnf());
            json.put("type", byteArrayToJSON(record.getType()));
            json.put("id", bytesToHex(record.getId()));
            json.put("payload", byteArrayToJSON(record.getPayload()));
        } catch (JSONException e) {
            //Not sure why this would happen, documentation is unclear.
            Log.e(TAG, "Failed to convert ndef record into json: " + record, e);
        }
        return json;
    }

    // endregion

    // region Device Capability

    /**
     * Checks if Mifare is supported on a device with some heuristics.
     * Will _try_ to detect if Mifare is supported on a device or not. Please note that it's not fool-proof:
     * on some older devices this can still return true while actual read/write later fails when a tag is scanned.
     *
     * Credits: ikarus23 (https://github.com/ikarus23/MifareClassicTool)
     * @see https://github.com/ikarus23/MifareClassicTool/blob/master/Mifare%20Classic%20Tool/app/src/main/java/de/syss/MifareClassicTool/Common.java#L588
     * @see https://github.com/ikarus23/MifareClassicTool/blob/master/INCOMPATIBLE_DEVICES.md
     */
    static boolean isDeviceSupported(Activity currentActivity) {
        if (currentActivity == null) {
            return false;
        }

        if (!currentActivity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_NFC)) {
            return false;
        }

        boolean foundViaFeatures = currentActivity.getPackageManager().hasSystemFeature("com.nxp.mifare");
        if (!foundViaFeatures) {
            return false;
        }

        boolean isLenovoP2 = Build.MANUFACTURER.equals("LENOVO")
                && Build.MODEL.equals("Lenovo P2a42");
        File device = new File("/dev/bcm2079x-i2c");
        if (!isLenovoP2 && device.exists()) {
            return false;
        }

        device = new File("/dev/pn544");
        if (device.exists()) {
            return true;
        }

        File libsFolder = new File("/system/lib");
        File[] libs = libsFolder.listFiles();
        if (libs != null) {
            for (File lib : libs) {
                if (lib.isFile()
                        && lib.getName().startsWith("libnfc")
                        && lib.getName().contains("brcm")) {
                    return false;
                }
            }
        }

        return true;
    }

    // endregion

}
