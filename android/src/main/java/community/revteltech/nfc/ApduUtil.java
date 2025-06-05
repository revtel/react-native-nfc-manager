package community.revteltech.nfc;

import android.util.Log;

public class ApduUtil {
    private static final String TAG = "ApduUtil";

    // APDU status words
    public static final byte[] A_OK = {(byte) 0x90, (byte) 0x00};
    public static final byte[] A_ERROR = {(byte) 0x6F, (byte) 0x00};
    public static final byte[] A_FILE_NOT_FOUND = {(byte) 0x6A, (byte) 0x82};
    public static final byte[] A_WRONG_LENGTH = {(byte) 0x67, (byte) 0x00};

    // NDEF Type 4 tag application AID
    public static final String NDEF_APP_AID = "D2760000850101";
    
    // NDEF file IDs
    private static final byte[] CAPABILITY_CONTAINER_FILE_ID = {(byte) 0xE1, (byte) 0x03};
    private static final byte[] NDEF_FILE_ID = {(byte) 0xE1, (byte) 0x04};

    // APDU command bytes
    private static final byte CLA = (byte) 0x00;
    private static final byte INS_SELECT = (byte) 0xA4;
    private static final byte INS_READ_BINARY = (byte) 0xB0;

    // Capability Container for NDEF Type 4 tag
    private static final byte[] CAPABILITY_CONTAINER = {
        (byte) 0x00, (byte) 0x0F, // CCLEN (15 bytes)
        (byte) 0x20,              // Mapping version 2.0
        (byte) 0x00, (byte) 0xFF, // MLe (maximum Le field in READ BINARY)
        (byte) 0x00, (byte) 0xFF, // MLc (maximum Lc field in UPDATE BINARY)
        (byte) 0x04,              // NDEF File Control TLV Tag
        (byte) 0x06,              // Length of file control TLV
        (byte) 0xE1, (byte) 0x04, // NDEF File ID
        (byte) 0xFF, (byte) 0xFE, // Maximum NDEF file size (65534 bytes)
        (byte) 0x00,              // NDEF file read access (always)
        (byte) 0x00               // NDEF file write access (always)
    };

    public static boolean isSelectCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 4 && 
               commandApdu[0] == CLA && 
               commandApdu[1] == INS_SELECT;
    }

    public static boolean isReadCommand(byte[] commandApdu) {
        return commandApdu != null && 
               commandApdu.length >= 5 && 
               commandApdu[0] == CLA && 
               commandApdu[1] == INS_READ_BINARY;
    }

    public static boolean isSelectNdefApp(byte[] commandApdu) {
        if (!isSelectCommand(commandApdu) || commandApdu.length < 12) {
            return false;
        }
        
        // Check if selecting NDEF application
        byte[] ndefAid = hexStringToByteArray(NDEF_APP_AID);
        if (commandApdu[4] != ndefAid.length) {
            return false;
        }
        
         // Add bounds check to prevent overflow
        if (5 + ndefAid.length > commandApdu.length) {
            return false;
        }

        for (int i = 0; i < ndefAid.length; i++) {
            if (commandApdu[5 + i] != ndefAid[i]) {
                return false;
            }
        }
        return true;
    }

    public static boolean isSelectFile(byte[] commandApdu, byte[] fileId) {
        if (!isSelectCommand(commandApdu) || commandApdu.length < 7) {
            return false;
        }
        
        // Check P1, P2 for file selection
        if (commandApdu[2] != (byte) 0x00 || commandApdu[3] != (byte) 0x0C) {
            return false;
        }
        
        if (commandApdu[4] != 2) { // Length should be 2 for file ID
            return false;
        }
        
        return commandApdu[5] == fileId[0] && commandApdu[6] == fileId[1];
    }

    public static boolean isSelectCapabilityContainer(byte[] commandApdu) {
        return isSelectFile(commandApdu, CAPABILITY_CONTAINER_FILE_ID);
    }

    public static boolean isSelectNdefFile(byte[] commandApdu) {
        return isSelectFile(commandApdu, NDEF_FILE_ID);
    }

    public static byte[] getCapabilityContainer() {
        byte[] response = new byte[CAPABILITY_CONTAINER.length + 2];
        System.arraycopy(CAPABILITY_CONTAINER, 0, response, 0, CAPABILITY_CONTAINER.length);
        response[CAPABILITY_CONTAINER.length] = A_OK[0];
        response[CAPABILITY_CONTAINER.length + 1] = A_OK[1];
        return response;
    }

    public static byte[] createNdefResponse(byte[] ndefData) {
        try {
            if (ndefData == null || ndefData.length == 0) {
                // Return empty NDEF file with just length header
                byte[] response = new byte[4]; // 2 bytes length + 2 bytes status
                response[0] = 0x00;
                response[1] = 0x00;
                response[2] = A_OK[0];
                response[3] = A_OK[1];
                return response;
            }

            // NDEF file format: 2-byte length + NDEF data
            int ndefLength = ndefData.length;
            byte[] response = new byte[2 + ndefLength + 2]; // length + data + status
            
            // Write NDEF length (big-endian)
            response[0] = (byte) ((ndefLength >> 8) & 0xFF);
            response[1] = (byte) (ndefLength & 0xFF);
            
            // Write NDEF data
            System.arraycopy(ndefData, 0, response, 2, ndefLength);
            
            // Write status
            response[2 + ndefLength] = A_OK[0];
            response[2 + ndefLength + 1] = A_OK[1];

            return response;
        } catch (Exception e) {
            Log.e(TAG, "Error creating NDEF response: " + e.getMessage());
            return A_ERROR;
        }
    }

    public static byte[] handleReadBinary(byte[] commandApdu, byte[] fileData) {
        if (commandApdu.length < 5) {
            return A_WRONG_LENGTH;
        }

        // Parse offset (P1P2)
        int offset = ((commandApdu[2] & 0xFF) << 8) | (commandApdu[3] & 0xFF);
        
        // Parse expected length (Le)
        int expectedLength = commandApdu[4] & 0xFF;
        if (expectedLength == 0) {
            expectedLength = 256; // Le=00 means 256 bytes
        }

        if (offset >= fileData.length) {
            return A_ERROR;
        }

        int actualLength = Math.min(expectedLength, fileData.length - offset);
        byte[] response = new byte[actualLength + 2];
        
        System.arraycopy(fileData, offset, response, 0, actualLength);
        response[actualLength] = A_OK[0];
        response[actualLength + 1] = A_OK[1];
        
        return response;
    }

    public static String bytesToHex(byte[] bytes) {
        if (bytes == null) return "null";
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

    public static byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i+1), 16));
        }
        return data;
    }
} 