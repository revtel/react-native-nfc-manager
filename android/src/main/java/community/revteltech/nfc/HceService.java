package community.revteltech.nfc;

import android.content.ComponentName;
import android.content.Intent;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.cardemulation.CardEmulation;
import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;
import android.util.Log;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.nfc.NfcAdapter;
import java.util.List;
import java.util.ArrayList;
import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONArray;
import java.nio.charset.StandardCharsets;
import android.content.Context;

public class HceService extends HostApduService {
    private static final String TAG = "HceService";
    public static final String ACTION_APDU_RECEIVED = "community.revteltech.nfc.ACTION_APDU_RECEIVED";
    public static final String ACTION_HCE_STARTED = "community.revteltech.nfc.ACTION_HCE_STARTED";
    public static final String ACTION_HCE_STOPPED = "community.revteltech.nfc.ACTION_HCE_STOPPED";
    public static final String EXTRA_SIMPLE_URL = "simple_url";
    public static final String EXTRA_CONTACT_VCF = "contact_vcf";

    // Static variables to maintain state across service lifecycle
    private static String staticSimpleUrl = null;
    private static boolean isServiceActive = false;
    private static String staticContactVcf = null;
    
    private String simpleUrl;
    private String contactVcf;
    private LocalBroadcastManager broadcastManager;

    // NDEF state
    private boolean ndefAppSelected = false;
    private boolean capabilityContainerSelected = false;
    private boolean ndefFileSelected = false;
    private byte[] currentNdefData = null;

    @Override
    public void onCreate() {
        super.onCreate();
        broadcastManager = LocalBroadcastManager.getInstance(this);
        isServiceActive = true;
        
        // Restore static state
        simpleUrl = staticSimpleUrl;
        contactVcf = staticContactVcf;

        
        // Broadcast service started
        broadcastManager.sendBroadcast(new Intent(ACTION_HCE_STARTED));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isServiceActive = false;
        
        // Broadcast service stopped
        if (broadcastManager != null) {
            broadcastManager.sendBroadcast(new Intent(ACTION_HCE_STOPPED));
        }
    }

    private void prepareNdefData() {
        try {
            if (contactVcf != null && !contactVcf.isEmpty()) {
                Log.d(TAG, "Preparing NDEF with VCF: " + contactVcf);
                
                NdefRecord vcfRecord = NdefRecord.createMime(
                    "text/x-vcard",
                    contactVcf.getBytes(StandardCharsets.UTF_8)
                );
                NdefMessage ndefMessage = new NdefMessage(new NdefRecord[]{vcfRecord});
                byte[] ndefBytes = ndefMessage.toByteArray();
                currentNdefData = new byte[2 + ndefBytes.length];
                currentNdefData[0] = (byte) ((ndefBytes.length >> 8) & 0xFF);
                currentNdefData[1] = (byte) (ndefBytes.length & 0xFF);
                System.arraycopy(ndefBytes, 0, currentNdefData, 2, ndefBytes.length);
                Log.d(TAG, "NDEF prepared with VCF, size: " + currentNdefData.length);
                return;
            }
            if (simpleUrl == null || simpleUrl.isEmpty()) {
                Log.d(TAG, "No URL or VCF, clearing NDEF data");
                currentNdefData = null;
                return;
            }

            Log.d(TAG, "Preparing NDEF with URL: " + simpleUrl);
            
            // Create URI record with explicit type and payload
            byte[] uriBytes = simpleUrl.getBytes(StandardCharsets.UTF_8);
            byte[] payload;
            
            if (simpleUrl.startsWith("https://")) {
                payload = new byte[uriBytes.length - 8 + 1];
                payload[0] = 0x04; // https:// prefix code
                System.arraycopy(uriBytes, 8, payload, 1, uriBytes.length - 8);
            } else if (simpleUrl.startsWith("http://")) {
                payload = new byte[uriBytes.length - 7 + 1];
                payload[0] = 0x03; // http:// prefix code
                System.arraycopy(uriBytes, 7, payload, 1, uriBytes.length - 7);
            } else {
                // Fallback to full URL without prefix code
                payload = new byte[uriBytes.length];
                System.arraycopy(uriBytes, 0, payload, 0, uriBytes.length);
            }
            
            NdefRecord uriRecord = new NdefRecord(
                NdefRecord.TNF_WELL_KNOWN,
                NdefRecord.RTD_URI,
                new byte[0], // No ID
                payload
            );
            
            NdefMessage ndefMessage = new NdefMessage(new NdefRecord[]{uriRecord});
            byte[] ndefBytes = ndefMessage.toByteArray();
            currentNdefData = new byte[2 + ndefBytes.length];
            currentNdefData[0] = (byte) ((ndefBytes.length >> 8) & 0xFF);
            currentNdefData[1] = (byte) (ndefBytes.length & 0xFF);
            System.arraycopy(ndefBytes, 0, currentNdefData, 2, ndefBytes.length);
            Log.d(TAG, "NDEF prepared with URL, size: " + currentNdefData.length);
            Log.d(TAG, "NDEF data hex: " + bytesToHex(currentNdefData));

        } catch (Exception e) {
            Log.e(TAG, "Error preparing NDEF data: " + e.getMessage(), e);
            currentNdefData = null;
        }
    }

    // Helper method to convert bytes to hex string for debugging
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String url = intent.getStringExtra(EXTRA_SIMPLE_URL);
            String vcf = intent.getStringExtra(EXTRA_CONTACT_VCF);
            
            Log.d(TAG, "onStartCommand - URL: " + url + ", VCF: " + vcf);

            if (vcf != null) {
                contactVcf = vcf;
                staticContactVcf = vcf;
                simpleUrl = null;
                staticSimpleUrl = null;
                prepareNdefData();
            } else if (url != null) {
                simpleUrl = url;
                staticSimpleUrl = url;
                contactVcf = null;
                staticContactVcf = null;
                prepareNdefData();
            } else {
                // Both are null - clear all content
                Log.d(TAG, "Clearing all content");
                contactVcf = null;
                staticContactVcf = null;
                simpleUrl = null;
                staticSimpleUrl = null;
                currentNdefData = null;
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null) {
            return ApduUtil.A_ERROR;
        }

        // Handle SELECT NDEF application
        if (ApduUtil.isSelectNdefApp(commandApdu)) {
            ndefAppSelected = true;
            capabilityContainerSelected = false;
            ndefFileSelected = false;
            prepareNdefData();
            return ApduUtil.A_OK;
        }

        // Only process further commands if NDEF app is selected
        if (!ndefAppSelected) {
            return ApduUtil.A_ERROR;
        }

        // Handle SELECT Capability Container
        if (ApduUtil.isSelectCapabilityContainer(commandApdu)) {
            capabilityContainerSelected = true;
            ndefFileSelected = false;
            return ApduUtil.A_OK;
        }

        // Handle SELECT NDEF file
        if (ApduUtil.isSelectNdefFile(commandApdu)) {
            capabilityContainerSelected = false;
            ndefFileSelected = true;
            return ApduUtil.A_OK;
        }

        // Handle READ BINARY commands
        if (ApduUtil.isReadCommand(commandApdu)) {
            if (capabilityContainerSelected) {
                byte[] ccData = ApduUtil.getCapabilityContainer();
                byte[] ccDataOnly = new byte[ccData.length - 2];
                System.arraycopy(ccData, 0, ccDataOnly, 0, ccDataOnly.length);
                return ApduUtil.handleReadBinary(commandApdu, ccDataOnly);
            }
            
            if (ndefFileSelected) {
                if (currentNdefData != null) {
                    return ApduUtil.handleReadBinary(commandApdu, currentNdefData);
                } else {
                    // Return empty NDEF file
                    byte[] emptyNdef = {0x00, 0x00};
                    return ApduUtil.handleReadBinary(commandApdu, emptyNdef);
                }
            }
        }

        return ApduUtil.A_ERROR;
    }

    @Override
    public void onDeactivated(int reason) {
        String reasonStr = (reason == DEACTIVATION_LINK_LOSS) ? "LINK_LOSS" : 
                          (reason == DEACTIVATION_DESELECTED) ? "DESELECTED" : "UNKNOWN";
    }

    // Service state methods
    public boolean isActive() {
        return isServiceActive;
    }

    public static boolean isRunning() {
        return isServiceActive && (staticSimpleUrl != null || staticContactVcf != null);
    }

    // Static method to clear all data
    public static void clearAllData() {
        staticSimpleUrl = null;
        staticContactVcf = null;
        isServiceActive = false;
    }

    // Static method to force clear current NDEF data
    public static void forceClearNdefData() {
        staticSimpleUrl = null;
        staticContactVcf = null;
    }
} 