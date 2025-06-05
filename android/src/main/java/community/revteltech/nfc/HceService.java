package community.revteltech.nfc;

import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;
import android.util.Log;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.LocalBroadcastManager;
import org.json.JSONObject;
import org.json.JSONException;

public class HceService extends HostApduService {
    private static final String TAG = "HceService";
    private static final byte[] STATUS_SUCCESS = {(byte) 0x90, (byte) 0x00};
    private static final byte[] STATUS_FAILED = {(byte) 0x6F, (byte) 0x00};
    private static final byte[] AID = {
        (byte) 0xF0, (byte) 0x01, (byte) 0x02, (byte) 0x03, (byte) 0x04, (byte) 0x05, (byte) 0x06
    };

    public static final String ACTION_APDU_RECEIVED = "community.revteltech.nfc.ACTION_APDU_RECEIVED";
    public static final String EXTRA_APDU_DATA = "apdu_data";
    public static final String EXTRA_APDU_RESPONSE = "apdu_response";
    public static final String EXTRA_RICH_DATA = "rich_data";
    public static final String EXTRA_SIMPLE_URL = "simple_url";

    private LocalBroadcastManager broadcastManager;
    private BroadcastReceiver apduReceiver;
    private String richData;
    private String simpleUrl;

    @Override
    public void onCreate() {
        super.onCreate();
        broadcastManager = LocalBroadcastManager.getInstance(this);
        setupApduReceiver();
    }

    private void setupApduReceiver() {
        apduReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (ACTION_APDU_RECEIVED.equals(intent.getAction())) {
                    if (intent.hasExtra(EXTRA_RICH_DATA)) {
                        richData = intent.getStringExtra(EXTRA_RICH_DATA);
                    }
                    if (intent.hasExtra(EXTRA_SIMPLE_URL)) {
                        simpleUrl = intent.getStringExtra(EXTRA_SIMPLE_URL);
                    }
                    byte[] response = intent.getByteArrayExtra(EXTRA_APDU_RESPONSE);
                    if (response != null) {
                        sendResponseApdu(response);
                    }
                }
            }
        };
        broadcastManager.registerReceiver(apduReceiver, new IntentFilter(ACTION_APDU_RECEIVED));
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null) {
            return STATUS_FAILED;
        }

        // Broadcast the received APDU command
        Intent intent = new Intent(ACTION_APDU_RECEIVED);
        intent.putExtra(EXTRA_APDU_DATA, commandApdu);
        broadcastManager.sendBroadcast(intent);

        // Check if the AID matches
        if (commandApdu.length < 5) {
            return STATUS_FAILED;
        }

        // Check if this is a SELECT command
        if (commandApdu[0] == (byte) 0x00 && commandApdu[1] == (byte) 0xA4) {
            // Verify AID
            int aidLength = commandApdu[4];
            if (aidLength != AID.length) {
                return STATUS_FAILED;
            }

            byte[] receivedAid = new byte[aidLength];
            System.arraycopy(commandApdu, 5, receivedAid, 0, aidLength);

            for (int i = 0; i < AID.length; i++) {
                if (receivedAid[i] != AID[i]) {
                    return STATUS_FAILED;
                }
            }

            // AID matches, return success
            return STATUS_SUCCESS;
        }

        // Handle GET DATA command
        if (commandApdu[0] == (byte) 0x00 && commandApdu[1] == (byte) 0x88) {
            // Check if we have rich content
            if (richData != null) {
                try {
                    // Create NDEF message with custom MIME type
                    JSONObject jsonData = new JSONObject(richData);
                    byte[] ndefMessage = createNdefMessage(jsonData);
                    byte[] response = new byte[ndefMessage.length + 2];
                    System.arraycopy(ndefMessage, 0, response, 0, ndefMessage.length);
                    response[ndefMessage.length] = STATUS_SUCCESS[0];
                    response[ndefMessage.length + 1] = STATUS_SUCCESS[1];
                    return response;
                } catch (JSONException e) {
                    Log.e(TAG, "Error creating NDEF message: " + e.getMessage());
                }
            }
            
            // Fall back to simple URL if rich content failed or isn't available
            if (simpleUrl != null) {
                try {
                    byte[] urlBytes = simpleUrl.getBytes();
                    byte[] response = new byte[urlBytes.length + 2];
                    System.arraycopy(urlBytes, 0, response, 0, urlBytes.length);
                    response[urlBytes.length] = STATUS_SUCCESS[0];
                    response[urlBytes.length + 1] = STATUS_SUCCESS[1];
                    return response;
                } catch (Exception e) {
                    Log.e(TAG, "Error creating URL response: " + e.getMessage());
                }
            }
            
            return STATUS_FAILED;
        }

        // Handle other APDU commands
        if (commandApdu[0] == (byte) 0x00) {
            switch (commandApdu[1]) {
                case (byte) 0x84: // GET RESPONSE
                    return handleGetResponse(commandApdu);
                case (byte) 0x8E: // GET STATUS
                    return handleGetStatus(commandApdu);
                default:
                    return STATUS_FAILED;
            }
        }

        return STATUS_SUCCESS;
    }

    private byte[] createNdefMessage(JSONObject jsonData) throws JSONException {
        // Create NDEF message with custom MIME type
        // Format: application/vnd.revteltech.nfc+json
        String mimeType = "application/vnd.revteltech.nfc+json";
        byte[] mimeTypeBytes = mimeType.getBytes();
        
        // Create NDEF record header
        byte[] recordHeader = new byte[] {
            (byte) 0xD1, // TNF_WELL_KNOWN | SR | ME
            (byte) 0x01, // Type length
            (byte) mimeTypeBytes.length, // Payload length
            (byte) 0x00  // ID length
        };

        // Combine header and payload
        byte[] ndefMessage = new byte[recordHeader.length + mimeTypeBytes.length + jsonData.toString().getBytes().length];
        System.arraycopy(recordHeader, 0, ndefMessage, 0, recordHeader.length);
        System.arraycopy(mimeTypeBytes, 0, ndefMessage, recordHeader.length, mimeTypeBytes.length);
        System.arraycopy(jsonData.toString().getBytes(), 0, ndefMessage, recordHeader.length + mimeTypeBytes.length, jsonData.toString().getBytes().length);

        return ndefMessage;
    }

    private byte[] handleGetResponse(byte[] commandApdu) {
        return STATUS_SUCCESS;
    }

    private byte[] handleGetStatus(byte[] commandApdu) {
        return STATUS_SUCCESS;
    }

    @Override
    public void onDeactivated(int reason) {
        Log.d(TAG, "Deactivated: " + reason);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (apduReceiver != null) {
            broadcastManager.unregisterReceiver(apduReceiver);
        }
    }
} 