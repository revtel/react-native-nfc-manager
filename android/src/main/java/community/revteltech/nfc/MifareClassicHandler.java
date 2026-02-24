package community.revteltech.nfc;

import static community.revteltech.nfc.NfcErrorCodes.*;

import android.nfc.TagLostException;
import android.nfc.tech.MifareClassic;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;

import java.util.Locale;

class MifareClassicHandler {
    private MifareClassicHandler() {
    }

    static void putConstants(java.util.Map<String, Object> constants) {
        constants.put("MIFARE_BLOCK_SIZE", MifareClassic.BLOCK_SIZE);
    }

    static void authenticate(
            TagTechnologyRequest techRequest,
            char type,
            int sector,
            ReadableArray key,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
            if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
                callback.invoke("mifareClassicAuthenticate fail: TYPE_UNKNOWN");
                return;
            } else if (sector >= mifareTag.getSectorCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicAuthenticate fail: invalid sector %d (max %d)",
                        sector,
                        mifareTag.getSectorCount()
                );
                callback.invoke(msg);
                return;
            } else if (key.size() != 6) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicAuthenticate fail: invalid key (needs length 6 but has %d characters)",
                        key.size()
                );
                callback.invoke(msg);
                return;
            }

            boolean result;
            if (type == 'A') {
                result = mifareTag.authenticateSectorWithKeyA(sector, rnArrayToBytes(key));
            } else {
                result = mifareTag.authenticateSectorWithKeyB(sector, rnArrayToBytes(key));
            }

            if (!result) {
                callback.invoke("mifareClassicAuthenticate fail: AUTH_FAIL");
                return;
            }

            callback.invoke(null, true);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicAuthenticate fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicAuthenticate fail: " + ex);
        }
    }

    static void getBlockCountInSector(
            TagTechnologyRequest techRequest,
            int sectorIndex,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicGetBlockCountInSector");
            if (mifareTag == null) {
                return;
            }
            if (sectorIndex >= mifareTag.getSectorCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicGetBlockCountInSector fail: invalid sector %d (max %d)",
                        sectorIndex,
                        mifareTag.getSectorCount()
                );
                callback.invoke(msg);
                return;
            }

            callback.invoke(null, mifareTag.getBlockCountInSector(sectorIndex));
        } catch (Exception ex) {
            callback.invoke("mifareClassicGetBlockCountInSector fail: " + ex);
        }
    }

    static void getSectorCount(TagTechnologyRequest techRequest, Callback callback) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicGetSectorCount");
            if (mifareTag == null) {
                return;
            }

            callback.invoke(null, mifareTag.getSectorCount());
        } catch (Exception ex) {
            callback.invoke("mifareClassicGetSectorCount fail: " + ex);
        }
    }

    static void sectorToBlock(
            TagTechnologyRequest techRequest,
            int sectorIndex,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicSectorToBlock");
            if (mifareTag == null) {
                return;
            }
            if (sectorIndex >= mifareTag.getSectorCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicSectorToBlock fail: invalid sector %d (max %d)",
                        sectorIndex,
                        mifareTag.getSectorCount()
                );
                callback.invoke(msg);
                return;
            }

            callback.invoke(null, mifareTag.sectorToBlock(sectorIndex));
        } catch (Exception ex) {
            callback.invoke("mifareClassicSectorToBlock fail: " + ex);
        }
    }

    static void readBlock(
            TagTechnologyRequest techRequest,
            int blockIndex,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicReadBlock");
            if (mifareTag == null) {
                return;
            }
            if (blockIndex >= mifareTag.getBlockCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicReadBlock fail: invalid block %d (max %d)",
                        blockIndex,
                        mifareTag.getBlockCount()
                );
                callback.invoke(msg);
                return;
            }

            byte[] buffer = mifareTag.readBlock(blockIndex);
            WritableArray result = bytesToRnArray(buffer);
            callback.invoke(null, result);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicReadBlock fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicReadBlock fail: " + ex);
        }
    }

    static void readSector(
            TagTechnologyRequest techRequest,
            int sectorIndex,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicReadSector");
            if (mifareTag == null) {
                return;
            }
            if (sectorIndex >= mifareTag.getSectorCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicReadSector fail: invalid sector %d (max %d)",
                        sectorIndex,
                        mifareTag.getSectorCount()
                );
                callback.invoke(msg);
                return;
            }

            WritableArray result = Arguments.createArray();
            int blocks = mifareTag.getBlockCountInSector(sectorIndex);
            for (int i = 0; i < blocks; i++) {
                byte[] buffer = mifareTag.readBlock(mifareTag.sectorToBlock(sectorIndex) + i);
                appendBytesToRnArray(result, buffer);
            }

            callback.invoke(null, result);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicReadSector fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicReadSector fail: " + ex);
        }
    }

    static void writeBlock(
            TagTechnologyRequest techRequest,
            int blockIndex,
            ReadableArray block,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicWriteBlock");
            if (mifareTag == null) {
                return;
            }
            if (blockIndex >= mifareTag.getBlockCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicWriteBlock fail: invalid block %d (max %d)",
                        blockIndex,
                        mifareTag.getBlockCount()
                );
                callback.invoke(msg);
                return;
            }
            if (block.size() != MifareClassic.BLOCK_SIZE) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicWriteBlock fail: invalid block size %d (should be %d)",
                        block.size(),
                        MifareClassic.BLOCK_SIZE
                );
                callback.invoke(msg);
                return;
            }

            byte[] buffer = rnArrayToBytes(block);
            mifareTag.writeBlock(blockIndex, buffer);
            callback.invoke(null, true);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicWriteBlock fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicWriteBlock fail: " + ex);
        }
    }

    static void incrementBlock(
            TagTechnologyRequest techRequest,
            int blockIndex,
            int value,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicIncrementBlock");
            if (mifareTag == null) {
                return;
            }
            if (blockIndex >= mifareTag.getBlockCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicIncrementBlock fail: invalid block %d (max %d)",
                        blockIndex,
                        mifareTag.getBlockCount()
                );
                callback.invoke(msg);
                return;
            }

            mifareTag.increment(blockIndex, value);
            callback.invoke(null, true);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicIncrementBlock fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicIncrementBlock fail: " + ex);
        }
    }

    static void decrementBlock(
            TagTechnologyRequest techRequest,
            int blockIndex,
            int value,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicDecrementBlock");
            if (mifareTag == null) {
                return;
            }
            if (blockIndex >= mifareTag.getBlockCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicDecrementBlock fail: invalid block %d (max %d)",
                        blockIndex,
                        mifareTag.getBlockCount()
                );
                callback.invoke(msg);
                return;
            }

            mifareTag.decrement(blockIndex, value);
            callback.invoke(null, true);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicDecrementBlock fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicDecrementBlock fail: " + ex);
        }
    }

    static void transferBlock(
            TagTechnologyRequest techRequest,
            int blockIndex,
            Callback callback
    ) {
        if (techRequest == null) {
            callback.invoke(ERR_NO_TECH_REQ);
            return;
        }

        try {
            MifareClassic mifareTag = getValidMifareClassic(techRequest, callback, "mifareClassicTransferBlock");
            if (mifareTag == null) {
                return;
            }
            if (blockIndex >= mifareTag.getBlockCount()) {
                String msg = String.format(
                        Locale.US,
                        "mifareClassicTransferBlock fail: invalid block %d (max %d)",
                        blockIndex,
                        mifareTag.getBlockCount()
                );
                callback.invoke(msg);
                return;
            }

            mifareTag.transfer(blockIndex);
            callback.invoke(null, true);
        } catch (TagLostException ex) {
            callback.invoke("mifareClassicTransferBlock fail: TAG_LOST");
        } catch (Exception ex) {
            callback.invoke("mifareClassicTransferBlock fail: " + ex);
        }
    }

    private static MifareClassic getValidMifareClassic(TagTechnologyRequest techRequest, Callback callback, String opName) {
        MifareClassic mifareTag = (MifareClassic) techRequest.getTechHandle();
        if (mifareTag == null || mifareTag.getType() == MifareClassic.TYPE_UNKNOWN) {
            callback.invoke(opName + " fail: TYPE_UNKNOWN");
            return null;
        }
        return mifareTag;
    }

    private static byte[] rnArrayToBytes(ReadableArray rArray) {
        byte[] bytes = new byte[rArray.size()];
        for (int i = 0; i < rArray.size(); i++) {
            bytes[i] = (byte) (rArray.getInt(i) & 0xff);
        }
        return bytes;
    }

    private static WritableArray bytesToRnArray(byte[] bytes) {
        return appendBytesToRnArray(Arguments.createArray(), bytes);
    }

    private static WritableArray appendBytesToRnArray(WritableArray value, byte[] bytes) {
        for (byte aByte : bytes) {
            value.pushInt((aByte & 0xFF));
        }
        return value;
    }
}
