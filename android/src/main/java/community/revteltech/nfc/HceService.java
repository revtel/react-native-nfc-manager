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
    private static List<String> staticSimpleUrls = new ArrayList<>();
    private static boolean isServiceActive = false;
    private static String staticContactVcf = null;

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
        
        // Restore static state
        contactVcf = staticContactVcf;
        
        // Service is active if there's any content
        isServiceActive = (!staticSimpleUrls.isEmpty() || staticContactVcf != null);
        
        Log.d(TAG, "Service created - isActive: " + isServiceActive + ", hasUrls: " + staticSimpleUrls.size() + ", hasVcf: " + (staticContactVcf != null));
        
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
                currentNdefData = createNdefFile(ndefMessage);
                Log.d(TAG, "NDEF prepared with VCF, size: " + currentNdefData.length);
                return;
            }
            
            if (staticSimpleUrls.isEmpty()) {
                Log.d(TAG, "No URLs or VCF, clearing NDEF data");
                currentNdefData = null;
                return;
            }

            Log.d(TAG, "Preparing NDEF with " + staticSimpleUrls.size() + " URLs: " + staticSimpleUrls);
            
            List<NdefRecord> allRecords = new ArrayList<>();
            for (String url : staticSimpleUrls) {
                if (url != null && !url.isEmpty()) {
                    List<NdefRecord> records = createUriRecords(url);
                    allRecords.addAll(records);
                }
            }
            
            if (allRecords.isEmpty()) {
                Log.d(TAG, "No valid URLs found, clearing NDEF data");
                currentNdefData = null;
                return;
            }
            
            NdefMessage ndefMessage = new NdefMessage(allRecords.toArray(new NdefRecord[0]));
            currentNdefData = createNdefFile(ndefMessage);
            Log.d(TAG, "NDEF prepared with " + allRecords.size() + " records from " + staticSimpleUrls.size() + " URLs, size: " + currentNdefData.length);
            Log.d(TAG, "NDEF data hex: " + bytesToHex(currentNdefData));

        } catch (Exception e) {
            Log.e(TAG, "Error preparing NDEF data: " + e.getMessage(), e);
            currentNdefData = null;
        }
    }
    
    /**
     * Create NDEF URI records based on the input URL
     * Creates only the exact URL provided,
     */
    private List<NdefRecord> createUriRecords(String url) {
        List<NdefRecord> records = new ArrayList<>();
        
        if (url == null || url.isEmpty()) {
            return records;
        }

        NdefRecord primaryRecord = NdefRecord.createUri(url);
        records.add(primaryRecord);
        Log.d(TAG, "Added URI record: " + url);
        
        return records;
    }
    
    private byte[] createNdefFile(NdefMessage ndefMessage) {
        try {
            byte[] ndefBytes = ndefMessage.toByteArray();
            
            // Validate NDEF message is not too large (iOS has stricter limits)
            if (ndefBytes.length > 8192) { // 8KB limit for better iOS compatibility
                Log.w(TAG, "NDEF message too large for iOS compatibility: " + ndefBytes.length + " bytes");
            }
            
            // Create proper NDEF file structure with length prefix
            byte[] ndefFile = new byte[2 + ndefBytes.length];
            
            // Write length as big-endian 16-bit value
            int length = ndefBytes.length;
            ndefFile[0] = (byte) ((length >> 8) & 0xFF);
            ndefFile[1] = (byte) (length & 0xFF);
            
            // Copy NDEF message data
            System.arraycopy(ndefBytes, 0, ndefFile, 2, ndefBytes.length);
            
            Log.d(TAG, "Created NDEF file with " + length + " bytes of NDEF data");
            return ndefFile;
        } catch (Exception e) {
            Log.e(TAG, "Error creating NDEF file: " + e.getMessage(), e);
            return new byte[]{0x00, 0x00}; // Return empty NDEF file on error
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
            // Check if this is an explicit clear command
            boolean hasUrlExtra = intent.hasExtra(EXTRA_SIMPLE_URL);
            boolean hasVcfExtra = intent.hasExtra(EXTRA_CONTACT_VCF);
            String url = intent.getStringExtra(EXTRA_SIMPLE_URL);
            String vcf = intent.getStringExtra(EXTRA_CONTACT_VCF);
            
            Log.d(TAG, "onStartCommand - URL: " + url + ", VCF: " + vcf + ", hasUrlExtra: " + hasUrlExtra + ", hasVcfExtra: " + hasVcfExtra);

            if (hasVcfExtra) {
                if (vcf != null && !vcf.isEmpty()) {
                    contactVcf = vcf;
                    staticContactVcf = vcf;
                    staticSimpleUrls.clear();
                    isServiceActive = true; // Activate service when setting content
                    prepareNdefData();
                } else {fear:
                    // Explicit clear VCF
                    Log.d(TAG, "Clearing VCF content");
                    contactVcf = null;
                    staticContactVcf = null;
                    currentNdefData = null;
                    // Don't deactivate if URL content might still exist
                    if (staticSimpleUrls.isEmpty()) {
                        isServiceActive = false;
                    }
                }
            } else if (hasUrlExtra) {
                if (url != null && !url.isEmpty()) {
                    // Add URL to the list (accumulate)
                    if (!staticSimpleUrls.contains(url)) {
                        staticSimpleUrls.add(url);
                    }
                    contactVcf = null;
                    staticContactVcf = null;
                    isServiceActive = true; // Activate service when setting content
                    prepareNdefData();
                    Log.d(TAG, "Added URL to collection. Total URLs: " + staticSimpleUrls.size());
                } else {
                    // Explicit clear URLs
                    Log.d(TAG, "Clearing URL content");
                    staticSimpleUrls.clear();
                    currentNdefData = null;
                    // Don't deactivate if VCF content might still exist
                    if (staticContactVcf == null) {
                        isServiceActive = false;
                    }
                }
            } else if (hasUrlExtra && hasVcfExtra && url == null && vcf == null) {
                // Both are explicitly null - clear all content and deactivate
                Log.d(TAG, "Clearing all content and deactivating service");
                contactVcf = null;
                staticContactVcf = null;
                staticSimpleUrls.clear();
                currentNdefData = null;
                isServiceActive = false;
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public byte[] processCommandApdu(byte[] commandApdu, Bundle extras) {
        if (commandApdu == null || commandApdu.length < 4) {
            Log.w(TAG, "Invalid APDU command received");
            return ApduUtil.A_ERROR;
        }

        Log.d(TAG, "Processing APDU: " + ApduUtil.bytesToHex(commandApdu));

        // Check if HCE is actually active and has content
        if (!isServiceActive || (staticSimpleUrls.isEmpty() && staticContactVcf == null)) {
            Log.d(TAG, "HCE service inactive or no content, rejecting all commands");
            byte[] response = ApduUtil.A_FILE_NOT_FOUND;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        // Handle SELECT NDEF application
        if (ApduUtil.isSelectNdefApp(commandApdu)) {
            Log.d(TAG, "NDEF application selected");
            ndefAppSelected = true;
            capabilityContainerSelected = false;
            ndefFileSelected = false;
            prepareNdefData();
            byte[] response = ApduUtil.A_OK;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        // Only process further commands if NDEF app is selected
        if (!ndefAppSelected) {
            Log.w(TAG, "NDEF app not selected, rejecting command");
            byte[] response = ApduUtil.A_FILE_NOT_FOUND;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        // Handle SELECT Capability Container
        if (ApduUtil.isSelectCapabilityContainer(commandApdu)) {
            Log.d(TAG, "Capability Container selected");
            capabilityContainerSelected = true;
            ndefFileSelected = false;
            byte[] response = ApduUtil.A_OK;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        // Handle SELECT NDEF file
        if (ApduUtil.isSelectNdefFile(commandApdu)) {
            Log.d(TAG, "NDEF file selected");
            capabilityContainerSelected = false;
            ndefFileSelected = true;
            byte[] response = ApduUtil.A_OK;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        // Handle READ BINARY commands
        if (ApduUtil.isReadCommand(commandApdu)) {
            if (capabilityContainerSelected) {
                Log.d(TAG, "Reading Capability Container");
                byte[] ccData = ApduUtil.getCapabilityContainer();
                byte[] ccDataOnly = new byte[ccData.length - 2];
                System.arraycopy(ccData, 0, ccDataOnly, 0, ccDataOnly.length);
                byte[] response = ApduUtil.handleReadBinary(commandApdu, ccDataOnly);
                Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
                return response;
            }
            
            if (ndefFileSelected) {
                Log.d(TAG, "Reading NDEF file");
                byte[] response;
                if (currentNdefData != null) {
                    response = ApduUtil.handleReadBinary(commandApdu, currentNdefData);
                } else {
                    // Return empty NDEF file
                    byte[] emptyNdef = {0x00, 0x00};
                    response = ApduUtil.handleReadBinary(commandApdu, emptyNdef);
                }
                Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
                return response;
            }
            
            Log.w(TAG, "READ command but no file selected");
            byte[] response = ApduUtil.A_FILE_NOT_FOUND;
            Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
            return response;
        }

        Log.w(TAG, "Unknown APDU command: " + ApduUtil.bytesToHex(commandApdu));
        byte[] response = ApduUtil.A_ERROR;
        Log.d(TAG, "Response APDU: " + ApduUtil.bytesToHex(response));
        return response;
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
        return isServiceActive && (!staticSimpleUrls.isEmpty() || staticContactVcf != null);
    }

    // Static method to clear all data and deactivate service
    public static void clearAllData() {
        staticSimpleUrls.clear();
        staticContactVcf = null;
        isServiceActive = false;
        Log.d(TAG, "All static data cleared and service deactivated");
    }

    // Static method to force clear current NDEF data
    public static void forceClearNdefData() {
        staticSimpleUrls.clear();
        staticContactVcf = null;
    }
} 