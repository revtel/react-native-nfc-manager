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
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.util.BitSet;

public class Util {

    static final String TAG = "NfcPlugin";

    //new 
    public static final short CREDENTIAL_FIELD_ID = 0x100e;
    public static final short SSID_FIELD_ID = 0x1045;
    public static final short AUTH_TYPE_FIELD_ID = 0x1003;
    public static final short AUTH_TYPE_WPA2_PSK = 0x0020;
    public static final short NETWORK_KEY_FIELD_ID = 0x1027;
    public static final int MAX_SSID_SIZE_BYTES = 32;
    public static final int MAX_MAC_ADDRESS_SIZE_BYTES = 6;
    public static final int MAX_NETWORK_KEY_SIZE_BYTES = 64;
    //new end
    
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
                }
            } catch (JSONException e) {
                Log.e(TAG, "Failed to convert ndef into json: " + ndef.toString(), e);
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
                Log.e(TAG, "Failed to convert tag into json: " + tag.toString(), e);
            }
        }
        return json;
    }

    static String translateType(String type) {
        String translation;
        if (type.equals(Ndef.NFC_FORUM_TYPE_1)) {
            translation = "NFC Forum Type 1";
        } else if (type.equals(Ndef.NFC_FORUM_TYPE_2)) {
            translation = "NFC Forum Type 2";
        } else if (type.equals(Ndef.NFC_FORUM_TYPE_3)) {
            translation = "NFC Forum Type 3";
        } else if (type.equals(Ndef.NFC_FORUM_TYPE_4)) {
            translation = "NFC Forum Type 4";
        } else {
            translation = type;
        }
        return translation;
    }

    static NdefRecord[] jsonToNdefRecords(String ndefMessageAsJSON) throws JSONException {
        JSONArray jsonRecords = new JSONArray(ndefMessageAsJSON);
        NdefRecord[] records = new NdefRecord[jsonRecords.length()];
        for (int i = 0; i < jsonRecords.length(); i++) {
            JSONObject record = jsonRecords.getJSONObject(i);
            byte tnf = (byte) record.getInt("tnf");
            byte[] type = jsonToByteArray(record.getJSONArray("type"));
            byte[] id = jsonToByteArray(record.getJSONArray("id"));
            byte[] payload = jsonToByteArray(record.getJSONArray("payload"));
            records[i] = new NdefRecord(tnf, type, id, payload);
        }
        return records;
    }

    static JSONArray byteArrayToJSON(byte[] bytes) {
        JSONArray json = new JSONArray();
        for (byte aByte : bytes) {
            json.put(aByte);
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

    static byte[] jsonToByteArray(JSONArray json) throws JSONException {
        byte[] b = new byte[json.length()];
        for (int i = 0; i < json.length(); i++) {
            b[i] = (byte) json.getInt(i);
        }
        return b;
    }

    static JSONArray messageToJSON(NdefMessage message) {
        if (message == null) {
            return null;
        }

        List<JSONObject> list = new ArrayList<JSONObject>();

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
            Log.e(TAG, "Failed to convert ndef record into json: " + record.toString(), e);
        }
        return json;
    }
    // static NdefRecord createWifiRecord(String[] data) {
    //     String ssid = data[0];
    //     String password = data[1];
    //     String auth = data[2];
    //     String crypt = data[3];
    //     byte[] authByte = auth.getBytes();
    //     byte[] cryptByte = crypt.getBytes();
    //     byte[] ssidByte = ssid.getBytes();
    //     byte[] passwordByte = password.getBytes();
    //     byte[] ssidLength = {(byte)((int)Math.floor(ssid.length()/256)), (byte)(ssid.length()%256)};
    //     byte[] passwordLength = {(byte)((int)Math.floor(password.length()/256)), (byte)(password.length()%256)};
    //     byte[] cred = {0x00, 0x36};
    //     byte[] idx = {0x00, 0x01, 0x01};
    //     byte[] mac = {0x00, 0x06};
    //     byte[] keypad = {0x00, 0x0B};
    
    //     byte[] payload = concat(NFCHelper.CREDENTIAL, cred,
    //             NFCHelper.NETWORK_IDX, idx,
    //             NFCHelper.NETWORK_NAME, ssidLength, ssidByte,
    //             NFCHelper.AUTH_TYPE, NFCHelper.AUTH_WPA_PERSONAL, authByte,
    //             NFCHelper.CRYPT_TYPE, NFCHelper.CRYPT_WEP, NFCHelper.CRYPT_AES_TKIP,
    //             NFCHelper.NETWORK_KEY, passwordLength, passwordByte);
    //            // NFCHelper.MAC_ADDRESS, mac);
    //     return NdefRecord.createMime(NFC_TOKEN_MIME_TYPE, payload);
    // } 

}
