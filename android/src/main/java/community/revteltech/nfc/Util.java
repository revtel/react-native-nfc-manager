package community.revteltech.nfc;

import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Util {

    static final String TAG = "NfcPlugin";
    final protected static char[] hexArray = "0123456789ABCDEF".toCharArray();

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

}
