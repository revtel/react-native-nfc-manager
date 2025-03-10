package community.revteltech.nfc;

import androidx.annotation.Nullable;

import java.nio.ByteBuffer;

public abstract class ApduUtil {
    public static final byte CLASS_OF_INSTRUCTION = 0x00;

    enum NfcInstruction {
        Select((byte)0xA4),
        ReadBinary((byte)0xB0),
        UpdateBinary((byte)0x00);

        private final byte numVal;

        NfcInstruction(byte numVal) {
            this.numVal = numVal;
        }

        public byte getValue() {
            return numVal;
        }
    }

    public static final byte[] NDEF_CAPABILITY_CONTAINER_FILE_ID = {
            (byte)0xE1,
            (byte)0x03
    };

    public static final byte[] SELECT_CAPABILITY_CONTAINER = buildSelectCompatabilityContainer(NDEF_CAPABILITY_CONTAINER_FILE_ID);


    //
    // We use the default AID from the HCE Android documentation
    // https://developer.android.com/guide/topics/connectivity/nfc/hce.html
    //
    // Ala... <aid-filter android:name="D2760000850101" />
    //
    public static byte[] buildApduSelect(byte[] tagApplicationName) {
        return buildCommand(NfcInstruction.Select, (byte)0x04, (byte)0x00, tagApplicationName, (byte)0x00);
    }

    public static byte[] buildSelectCompatabilityContainer(byte[] compatabilityContainerFileId) {
        return buildCommand(
            NfcInstruction.Select,
            (byte)0x00, // Select by file identifier
            (byte)0x0C, // Use First or only occurrence
            compatabilityContainerFileId, // file identifier of the CC file
            null
        );
    }

    public static final byte[] READ_CAPABILITY_CONTAINER =  buildCommand(
            NfcInstruction.ReadBinary,
            (byte)0x00, (byte)0x00, // Offset in Capability Container where to start reading
            null,
            (byte)0x0F // Length - protocol hardcoded to 15 for the size of the container data
    );

    public static byte[] buildSelectNdefFile(byte[] ndefFileId) {
        return buildCommand(
            NfcInstruction.Select,
            (byte)0x00, // Select by file identifier
            (byte)0x00, // Use First or only occurrence
            ndefFileId, // file identifier of the CC file
            null
        );
    }

    public static final byte[] NDEF_READ_BINARY_NLEN = {
            CLASS_OF_INSTRUCTION, // Class byte (CLA)
            NfcInstruction.ReadBinary.getValue(), // Instruction byte (INS) for ReadBinary command
            (byte)0x00, (byte)0x00, // Parameter byte (P1, P2), offset inside the CC file
            (byte)0x02  // Le field
    };

    public static final byte[] getReadNdefBinary(int ndefFileLength) {
      return buildCommand(
            NfcInstruction.ReadBinary, // Instruction byte (INS) for ReadBinary command
            (byte)0x00, (byte)0x00, // Parameter byte (P1, P2), offset inside the CC file
            null,
            (byte)ndefFileLength  //  Le field
      );
    };

    public static final byte[] A_OKAY = {
            (byte)0x90,  // SW1	Status byte 1 - Command processing status
            (byte)0x00   // SW2	Status byte 2 - Command processing qualifier
    };

    public static final byte[] A_ERROR = {
            (byte)0x6A, // SW1	Status byte 1 - Command processing status
            (byte)0x82, // SW2	Status byte 2 - Command processing qualifier
    };


    private static byte[] buildCommand(NfcInstruction instruction, byte parameter1, byte parameter2, @Nullable byte[] data, Byte leField) {
        ByteBuffer buffer = ByteBuffer
                .allocate(6 + (data != null ? data.length : 0) - (leField == null ? 1 : 0))
                .put(CLASS_OF_INSTRUCTION) // CLA	- Class - Class of instruction
                .put(instruction.getValue()) // INS	- Instruction - Instruction code
                .put(parameter1) // P1	- Parameter 1 - Instruction parameter 1
                .put(parameter2); // P2	- Parameter 2 - Instruction parameter 2

        if (data != null) {
            buffer = buffer.put((byte)data.length) // Lc field	- Number of bytes present in the data field of the command
                    .put(data); // Application Identifier
        }

        if (leField != null) {
            buffer = buffer.put(leField);
        }

        return buffer.array();
    }
}
